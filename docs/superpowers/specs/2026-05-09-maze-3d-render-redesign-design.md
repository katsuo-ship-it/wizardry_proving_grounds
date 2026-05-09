# 迷宮 3D 描画再設計 (Three.js + Shaded Walls) — 設計書

**Status**: Draft
**Author**: katsuo.ito + Claude Opus 4.7
**Date**: 2026-05-09
**Predecessor**: M4 (per-cell rect 方式 wireframe、暫定品質)、L1 完全データ取り込み
**Successor**: M6 (i18n 仕上げ + 設定画面)、Chapter 2 (戦闘・呪文・モンスター)
**Resolves**: open-questions.md Q-014 (迷宮 3D 描画アルゴリズム再設計)

## 1. 目的

M4 で実装した「各 (depth, rel) セルを独立した内側矩形として描画する」per-cell rect
方式は、隣接 depth で edge 状態 (wall / open) が変わると線の終端が宙に浮き、
連続壁の境界で線が中途半端に途切れる構造的バグを抱えている。L1 完全データ取り込み後の
手動プレイテストでこの根本的描画バグが顕在化した。

`wip/maze-render-polish-attempt` ブランチで暫定 polish (壁の塗りつぶし polygon、
最奥フレーム強制描画など) を試行したが、per-cell rect 構造を維持したままでは
線接続を保証できないと結論。本設計では描画方式を全面再設計する。

## 2. 採用アプローチと却下案

| 選択肢 | 説明 | 採否 |
|---|---|---|
| **Three.js + Shaded Walls** | 本物の 3D シーンを構築。壁/床/天井を mesh 化し、距離フォグと面のシェーディングで立体感を表現 | **✓** |
| range-scan (純 2D) | 連続壁の range を検出し 1 つの台形で描画。線途切れがアルゴリズム的に解消、Apple II 原典忠実 | ✗ — 採用しない |
| 現方式 polish 延命 | wip ブランチの方向 (塗りつぶし + 座標微調整) を main に持ってくる | ✗ — 線途切れの根本解消にならない |

**選定理由**: 当初は range-scan 方式で原典忠実を維持する方針だったが、再設計に着手するに
あたりユーザーが「3D エンジン + Apple II 風 LOOK」を再選択。LOOK の純度については
"Shaded Walls" (距離フォグ + 面シェーディング) を採用し、原典色準拠は破棄する方針で合意。

## 3. スコープ

### 含む

- `src/render/maze/` 配下の全置換 (Three.js ベース)
- カメラ補間 (前進 150ms / 回転 90° 200ms / easeInOutQuad)
- L1 全マップを起動時に静的 mesh 化 + frustum culling
- 階段マーカー (床 plane に CanvasTexture で矢印)
- 扉 (壁 plane に重ねた小さな凹み枠)
- 隠し扉 (壁と同一描画、原典準拠)
- Playwright によるスクリーンショット回帰テスト基盤の新設

### 含まない (将来タスク)

- HUD (方角コンパス、座標表示) の DOM オーバーレイ
- 階段昇降フェード演出
- 視界ブロック (`occluder` mesh による「壁の向こうのチラ見え」抑制) — 原典通り「奥が見える」を許容
- 戦闘シーンの 3D モンスター描画 (Chapter 2)
- 迷宮内ライティングのバリエーション (松明 / 暗闇マスでの視界制限) (Chapter 4 以降)
- L2 以降の追加マップ build

### 不変 (本タスクで触らない)

- reducer / state / event 定義 (`src/engine/state/`)
- 永続化 (`src/persist/`)
- 入力キュー (`MAX_QUEUED_INPUTS = 1`、`QUEUE_TIMEOUT_MS = 5000`、内部 event bypass)
- L1 マップデータ自体
- HUD テキスト ("L1 (x, y) U" 等)

## 4. アーキテクチャ全体像

新ディレクトリ構成:

```
src/render/maze/                 (全置換)
├── scene.ts                     L1 全壁/床/天井の static mesh build (一度だけ)
├── camera.ts                    camera 構築 + 補間ロジック (target pos/dir → camera transform)
├── materials.ts                 wall / door / stairs / floor の Material 定義 (shaded fog)
├── view.ts                      Renderer ライフサイクル (mount/unmount/dispose) + RAF
├── geom.ts                      MazeLevel → BufferGeometry 変換 (純関数、テスト対象)
├── overlay.ts                   階段マーカー床テクスチャ生成 (canvas → CanvasTexture)
└── types.ts                     SceneCtx, CameraTarget, etc.
```

**削除**: 既存 `wireframeTable.ts` / `segments.ts` / `viewport.ts` / `render.ts`。
`src/render/canvas/draw.ts` は迷宮描画から外れるが、将来の HUD 用途で残置。

**接続点**:
- `src/screens/Maze/index.tsx` 内の Canvas 要素を Three.js Renderer がマウント
- state (位置/向き) の変化を `useEffect` で検知して `camera.animateTo(target)` 呼び出し
- 既存 `bindAnimation` orchestrator は `isAnimating` フラグの ON/OFF のみで使う (具体的 frame 描画は新 `view.ts` が担う)
- reducer / state / types は完全無変更

**バンドル影響**: Three.js core (~150KB gzip) + 自前コード (~5KB)。
総バンドル 65.77KB → ~220KB gzip 想定。

## 5. シーンモデル (geometry / 座標系)

### 座標系
- ワールド座標 = グリッド座標 × `CELL_SIZE` (= 1.0、単純化のため単位 = 1 セル)
- グリッド: x = 東方向 (+)、y = 北方向 (+) → Three.js では x = 東、**z = 北 (= -y)** にマップ
- Y 軸は上向き (高さ)
- 壁の高さ = `WALL_HEIGHT = 1.0` (= 1 セル分、立方空間)

### Geometry 単位

| 種別 | Geometry | サイズ | 配置 |
|---|---|---|---|
| 壁エッジ | `PlaneGeometry(1, 1)` | 1 × 1 | セル間境界、`DoubleSide` (両面) |
| 扉 | `PlaneGeometry(0.6, 0.7)` | 0.6 × 0.7 | 壁 plane に重ね、内側に微オフセット |
| 床 | `PlaneGeometry(1, 1)` | 1 × 1 | 通行可能セルのみ、y = 0、上向き法線 |
| 天井 | `PlaneGeometry(1, 1)` | 1 × 1 | 通行可能セルのみ、y = 1、下向き法線 |
| 階段マーカー | `PlaneGeometry(0.6, 0.6)` | 0.6 × 0.6 | 階段セルの床上 (y = 0.01、Z-fighting 回避) |

`secretDoor` は壁 mesh と同一表現 (原典忠実)。

### Mesh 統合

同 material の geometry を `BufferGeometryUtils.mergeGeometries` で 1 mesh にまとめる。
L1 (20×20) で予想される draw call: 壁 1 / 床 1 / 天井 1 / 扉 1 / 階段 1 = **5 draw call**。

### Camera

- `PerspectiveCamera(fov=75, aspect=280/192, near=0.05, far=10)`
- 位置 = `(playerX + 0.5, 0.5, playerY + 0.5)` (セル中央、目線高さ = 0.5)
- 向き = playerDir に応じた `lookAt`

### Pure 関数化

`geom.ts` 内の以下を純関数として export し vitest で検証:
- `buildWallGeometry(level) → BufferGeometry`
- `buildFloorGeometry(level) → BufferGeometry`
- `buildCeilingGeometry(level) → BufferGeometry`
- `buildDoorGeometry(level) → BufferGeometry`
- `buildStairsGeometry(level) → BufferGeometry`

Three.js を import するが BufferGeometry を返すだけなので、頂点配列 / インデックス /
center 座標を assertion 可能。

## 6. マテリアル & シェーディング

### ライティング

- `AmbientLight(0x404060, 0.4)` — 全体に薄い青みがかった暗さ (ダンジョン感)
- `DirectionalLight(0xa0a0c0, 0.6)` — 上方やや前から、影は計算しない (パフォーマンス・原典の平面感)
- `Fog(0x000000, 1.5, 4.0)` — 黒フォグ、1.5 セル先から 4.0 セル先で完全黒。原典の「奥が見えない」を再現しつつ深さの距離感を与える

### マテリアル定義 (全て `MeshLambertMaterial`、フォグ自動適用)

| 種別 | color | 備考 |
|---|---|---|
| 壁 | `0x808080` | やや明るめのグレー、距離フォグで奥は黒に沈む |
| 床 | `0x303030` | 暗めグレー、足元の輪郭が分かる程度 |
| 天井 | `0x202020` | 床より暗く、上を見上げた時に区別できる |
| 扉 | `0x603020` | くすんだ茶色 (木材イメージ)、壁と明度差で識別可能 |
| 階段マーカー | `0xa0a060` | くすんだ黄、矢印テクスチャを CanvasTexture で生成 |

**色パレットの根拠**: Apple II HGR は 6 色制限 (黒/白/緑/紫/橙/青) だが、Shaded Walls 路線を
選択した時点で原典色準拠は破棄済み。ダンジョンの「暗い・湿った」雰囲気を優先したくすんだ
中明度の RGB を採用。配色は実装後の手動プレイテストで微調整 (定数 1 箇所
`materials.ts` で集中管理)。

### Material 共有

`materials.ts` がモジュールスコープで 5 つの Material インスタンスを生成して export。
Mesh 間で共有することで draw call を最小化。

### シェーダ拡張は採用しない

`MeshLambertMaterial` + Fog で「Shaded Walls」要件は十分満たせる。
カスタム ShaderMaterial は YAGNI。

## 7. カメラ補間とアニメーション

### Camera Target 抽象

```typescript
interface CameraTarget {
  pos: { x: number; y: number };  // ワールド座標 (= grid + 0.5)
  yaw: number;                     // ラジアン、0 = 北、+π/2 = 東
}
```

state の `MazePosition` (grid x, y, dir) → CameraTarget への純関数
`targetFromPosition(pos)` を `camera.ts` で定義 (テスト対象)。

### 補間器

- `CameraAnimator.animateTo(target, durationMs)` を提供
- 補間関数は `easeInOutQuad` (前進・回転とも自然なスタート/ストップ感)
- 回転は最短経路で補間 (`shortestAngleDelta`、+270° 回転より −90° 回転を選ぶ)
- 進行中の `animateTo` 呼び出しは現在補間を即座にキャンセルし新 target へリスタート (= 入力キュー先読み 1 操作分が滑らかに繋がる)
- 補間中は毎フレーム camera 位置/向きを更新 + `renderer.render(scene, camera)` 呼び出し

### 所要時間 (M4 spec 準拠)

- 前進 1 セル = **150 ms**
- 回転 90° = **200 ms**
- 後退 1 セル = **150 ms** (前進と同様)
- 階段昇降は瞬時 (フェード演出は本タスクのスコープ外)

### RAF 戦略

- アニメーション中のみ RAF を回す (アイドル時は RAF 停止 = 静止画は最後の 1 フレームを残す)
- アイドル時に scene を再描画する必要がある場合 (リサイズ等) は `requestAnimationFrame` を 1 回だけ強制発火

### 既存 orchestrator との接続

- 既存の `bindAnimation` は state の前進/回転 event を検知して `isAnimating` フラグを立てている
- 本実装はそのフラグの ON/OFF タイミングに合わせて `animateTo` を起動・解放する
- 入力キュー (`MAX_QUEUED_INPUTS = 1` / `QUEUE_TIMEOUT_MS = 5000`) と内部 event の bypass は既存維持

### Maze 画面アンマウント時

- `view.ts` の `dispose()` を呼び、Renderer / Geometry / Material / Texture を全解放 (Three.js の GPU リソースリーク防止)

## 8. L1 メッシュ構築 (データ → geometry)

### 入力

既存の `MazeLevel` 型 (`src/engine/data/maze/types.ts`)。L1 データは取り込み済 (Sorcery 由来、20×20)。

### Edge 重複の正規化

セル A の east エッジとセル B (= A の右隣) の west エッジは同じ壁を指す。
既存 `getEdge(level, x, y, dir)` は M4 で正規化済 → そのまま利用。

`geom.ts` 側ではセルを順に走査し「north エッジ」「west エッジ」のみ検査することで
重複描画を防ぐ。外周セルは north/west に加えて south/east も検査。

### 走査ロジック (擬似コード)

```
for y in 0..19, x in 0..19:
  cell = level[y][x]
  if cell == void: continue
  for each edge in [north, west]:
    type = getEdge(level, x, y, edge)
    if type == 'open': continue
    if type in ['wall', 'secretDoor']: emit wall plane
    if type == 'door': emit wall plane (枠) + door plane (扉)
  if y == 19 and southEdge != 'open': emit  (外周南)
  if x == 19 and eastEdge != 'open': emit   (外周東)
```

### Plane 配置

| エッジ | center | 法線 |
|---|---|---|
| 北壁 (cell (x,y) の north) | `(x + 0.5, 0.5, y)` | `DoubleSide` で両面描画 |
| 西壁 (cell (x,y) の west) | `(x, 0.5, y + 0.5)` | 90° 回転、`DoubleSide` |

### 床 / 天井

- `walkable` セル (= 通行可能 = void でも壁でもない) のみ床と天井を 1 枚ずつ
- 床 plane: y = 0、上向き法線
- 天井 plane: y = 1、下向き法線

### 階段マーカー

- `cell.special === 'stairsUp'` または `'stairsDown'` のセルで、床 plane の上 (y = 0.01) に小さな plane (0.6 × 0.6)
- テクスチャは `overlay.ts` で動的生成: 64×64 Canvas に矢印 (上向き三角 / 下向き三角) を描画 → `CanvasTexture`

### Mesh 統合の手順

1. 種別ごと (壁/床/天井/扉/階段) に geometry を配列収集
2. `BufferGeometryUtils.mergeGeometries(arr, false)` で 1 mesh per 種別 = 計 5 mesh
3. 各 mesh に対応 material を割当
4. `scene.add(mesh)` で完了

### 初期化タイミング

- Maze 画面マウント時に 1 回だけ全 mesh build。L1 = 20×20 = 約 ~600 plane 程度の predicted カウント、build 時間 < 50ms 想定
- L1 → L2 遷移時 (Chapter 2 以降) は scene 全体を再 build (L1 mesh dispose → L2 build)

## 9. テスト戦略

### 9.1 純関数 unit test (vitest)

- `targetFromPosition(MazePosition) → CameraTarget` (camera.ts)
- `shortestAngleDelta(from, to) → number` (camera.ts)
- `easeInOutQuad(t) → number` (camera.ts)
- `interpolateTarget(from, to, t) → CameraTarget` (camera.ts)
- `buildWallGeometry(level) → BufferGeometry` (geom.ts) — 頂点数 / インデックス数 / center 座標を assertion
- `buildFloorGeometry(level) → BufferGeometry` — walkable セル数 × 4 頂点を assertion
- `buildStairsGeometry(level) → BufferGeometry` — 階段セル数と一致

想定追加テスト数: ~30〜40 件

### 9.2 シーン構造 integration test (vitest + happy-dom + WebGL stub)

- `buildScene(level)` を呼び出し、`scene.children` の Mesh 数 = 5 を検証
- Material 共有 (壁 mesh 全てが同 material インスタンスを参照) を検証
- カメラ初期位置が start position (`(0.5, 0.5, 19.5)` = TS 座標 (0, 19) 北向き) と一致を検証
- Three.js は WebGL コンテキストなしでも `Scene` / `Geometry` / `Material` の構築は可能。`WebGLRenderer` のみモック (no-op stub)

### 9.3 ビジュアル回帰 (Playwright + screenshot diff)

- 新規依存: `@playwright/test` (devDependencies)
- CI step 追加: `pnpm exec playwright install --with-deps chromium` (~300MB、CI ジョブ初回のみキャッシュ可)

**Baseline screenshot 取得位置 (8 視点 × 4 方向 = 32 screenshot)**:

| # | 位置 | 想定セル | 確認観点 |
|---|---|---|---|
| 1 | start position | (0, 19) 北向き | 最も典型的な開始視点 |
| 2 | 廊下 + 前方扉 | L1 から扉のある通路を選定 | 扉描画・距離感 |
| 3 | T 字路の真ん中 | 左右開け前壁 | 三方向描画 |
| 4 | 4 方向開けたセル | オープンエリア | 開放感、奥行き |
| 5 | 階段マスの上 | stairsUp / stairsDown | 階段マーカー |
| 6 | 行き止まりに正対 | dead end | 前壁 + 左右壁 |
| 7 | 隣接の扉と壁が混在 | 旧バグ再現位置 | 線途切れ解消の確認 |
| 8 | 暗闇マス | darkness 属性 | 普通描画 (Chapter 4 で挙動変更予定) |

- diff 閾値: pixel diff 0.5%（`toMatchSnapshot({ threshold: 0.005 })`）
- フォント・shading の僅差で false positive を出さない設定

### 9.4 Failure トリアージ

- baseline 更新は `pnpm test:visual --update-snapshots` で明示的に実行 (CI では自動更新しない)
- 差分発生時は PR で diff 画像を artifact として upload (Playwright の HTML report 機能)

### 9.5 CI 統合

- `.github/workflows/ci.yml` の既存 vitest step の後に `playwright test --reporter=line` を追加
- 既存 CI 40 秒 → 想定 ~80〜90 秒に延長 (Chromium 起動 + 32 screenshot)
- baseline はリポジトリにコミット (`tests/visual/__snapshots__/`)

### 9.6 テストしない領域

- 補間中の中間フレーム (時刻依存・不安定) → 開始/終了 frame のみ snapshot
- 描画パフォーマンス (FPS 計測) → 開発時 DevTools で目視確認
- マテリアルの色値 (主観調整なので test ハードコードは無意味) → 手動プレイテスト

## 10. 移行計画

### PR 単位の想定ステップ

1. **deps 追加**: `pnpm add three @types/three` + `pnpm add -D @playwright/test`
2. **新ディレクトリ追加**: `src/render/maze/{scene,camera,materials,view,geom,overlay,types}.ts` を空 + 型定義のみで scaffold
3. **geom.ts / camera.ts 純関数実装** + unit test (vitest)。この時点ではまだ画面に出ない
4. **scene.ts / view.ts 統合**: `screens/Maze/index.tsx` の Canvas 要素を Three.js Renderer がマウント。旧 `render.ts` 呼び出しを差し替え
5. **旧ファイル削除**: `wireframeTable.ts` / `segments.ts` / `viewport.ts` / `render.ts`
6. **既存 spec 更新**: `docs/superpowers/specs/2026-05-04-wizardry-proving-grounds-design.md` の Section 5 を新方式に書き換え
7. **Playwright 導入** + 8 視点 × 4 方向 baseline 取得 + CI step 追加
8. **手動プレイテスト**: 開始位置から L1 を一周、旧バグ再現位置で改善確認
9. **リリースノート + open-questions.md の Q-014 解消**

### ドキュメント影響範囲

- `docs/superpowers/specs/2026-05-04-wizardry-proving-grounds-design.md` の **Section 5 「迷宮 3D ワイヤーフレーム描画アルゴリズム」** は新方式 (Three.js + Shaded Walls) に全面書き換え。`WIREFRAME_TABLE` の言及・Pascal 抽出のフォールバック説明・per-cell rect 方式の解説は削除
- `wip/maze-render-polish-attempt` ブランチは参考用に残す (削除しない)
- `docs/chapters/1/open-questions.md` の Q-014 を「解決済」へ移動

## 11. リスク

| リスク | 影響 | 対策 |
|---|---|---|
| バンドル 65.77KB → ~220KB gzip | 初回ロード若干増 (Vercel 上では問題なし、まだ 1MB の 1/4) | tree-shaking で three の未使用機能を排除、初期 progress 表示は不要範囲内 |
| Playwright で CI 時間 40s → ~90s | フィードバックサイクル悪化 | Chromium バイナリを GitHub Actions cache にキャッシュ (初回 ~3 分 → 以降 ~10 秒) |
| WebGL 非対応環境での描画失敗 | 旧 iOS / 制限環境で迷宮画面が真っ黒 | Maze 画面マウント時に `WebGLRenderer` 初期化を try-catch、失敗時はエラーバナー表示 (DOM) と fallback 文言。Chapter 2 までに統計確認 |
| 階段マーカー CanvasTexture が SSR で `document` を参照 | Vite SSR は使っていないので問題なし | SSR 導入時に lazy 初期化に変更 (現時点では不要) |
| baseline screenshot の保守コスト | 配色微調整のたびに 32 画像更新 | baseline 更新は明示コマンド。「色変更 PR」では更新を許容、「ロジック変更 PR」では差分が出たらバグ |
| Three.js メジャー更新 (例: r160 → r170) で API 破壊 | 数か月後にメンテ作業発生 | dependabot 経由でアラート。本仕様で使う API は基本 (Scene/Mesh/Camera/Material/Fog) のみで安定範囲 |
| 「描画品質の主観評価」がテストで担保不能 | 配色・フォグの調整漏れ | 各 PR で該当するなら手動プレイテストを test plan に必ず明記 |

## 12. オープン項目

- **OQ-1**: バンドルサイズ実測値 (~220KB gzip 想定の妥当性) — Phase 4 完了時点で実測
- **OQ-2**: 旧バグ再現位置 #7 の正確なセル座標 — L1 マップを目視して選定 (実装着手時)
- **OQ-3**: Three.js のバージョン pin (latest stable r161 想定) — `pnpm add` 時点で確定
- **OQ-4**: Playwright baseline がプラットフォーム差 (Windows/Linux) で僅差を出すか — CI で 1 度確認、問題があれば `--platform` 指定または baseline を Linux 専用化
