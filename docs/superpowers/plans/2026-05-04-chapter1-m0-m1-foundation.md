# Wizardry Proving Grounds - Chapter 1 / M0 + M1 Foundation Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Pascal データ抽出 (M0) + Vite/React/TS プロジェクト基盤・Apple II 風 UI 基盤・Title 画面・初回 Vercel デプロイ (M1)。Title 画面が Vercel 本番環境で見られる状態を完成させる。

**Architecture:** Vite + React + TypeScript SPA。Zustand を薄いラッパとし、自作 reducer + discriminated union でステートマシンを構築。入力キュー (1 操作先行) + 副作用 Orchestration の基盤を最初から組み込む。Apple II 280×192 仮想ピクセルグリッドを CSS 変数 `--vp` で表現し、整数倍スケールで全ブラウザ・全画面サイズに対応。

**Tech Stack:** Vite 5, React 18, TypeScript 5 (strict), Zustand, idb, Biome, Vitest, fake-indexeddb, Vercel, GitHub Actions

**Reference:** [設計書 docs/superpowers/specs/2026-05-04-wizardry-proving-grounds-design.md](../specs/2026-05-04-wizardry-proving-grounds-design.md)

---

## File Structure

### Phase A: M0 Pascal 抽出
- Create: `docs/reference/wiz1/README.md` — 抽出手順・参照方法
- Create: `docs/reference/wiz1/extraction-log.md` — 抽出作業の進行ログ
- Create: `docs/reference/wiz1/pascal-sources/` — `.TEXT` ファイル配置先
- Create: `docs/reference/wiz1/data-tables/races.md` — RACES 配列の解読結果
- Create: `docs/reference/wiz1/data-tables/classes.md` — CLASSES 配列の解読結果
- Create: `docs/reference/wiz1/data-tables/items.md` — ITEMS 配列（Chapter 1 装備抜粋）の解読結果
- Create: `docs/reference/wiz1/data-tables/maze-l1.md` — MAZEDATA L1 の解読結果
- Create: `docs/reference/wiz1/algorithms/character-creation.md` — MAKECHARACTER ロジックの翻訳
- Create: `docs/chapters/1/open-questions.md` — 不明点の記録
- Create: `scripts/extract-dsk.ps1` — CiderPress CLI 呼び出しヘルパー (PowerShell)

### Phase B: M1 プロジェクトスケルトン
- Create: `package.json` — pnpm 管理、依存定義
- Create: `pnpm-workspace.yaml` (なし、単一パッケージ)
- Create: `tsconfig.json` — strict mode
- Create: `vite.config.ts` — React プラグイン、alias 設定
- Create: `vitest.config.ts` — jsdom 環境、fake-indexeddb セットアップ
- Create: `biome.json` — lint + format 設定
- Create: `.gitignore` — node_modules, dist, .vercel
- Create: `index.html` — エントリ HTML
- Create: `src/main.tsx` — React エントリ
- Create: `src/App.tsx` — ルートコンポーネント
- Create: `vite-env.d.ts`

### Phase C: Apple II UI 基盤
- Create: `public/fonts/PrintChar21.ttf` — Apple II 風英語フォント (実ファイル取得)
- Create: `public/fonts/MisakiGothic.ttf` — 美咲 8x8 日本語フォント (実ファイル取得)
- Create: `src/ui/global.css` — `--vp` CSS 変数、フォント @font-face、リセット
- Create: `src/ui/scale.ts` — `computeScale()` + resize handler + フォントロード待ち
- Create: `src/ui/components/Frame.tsx` — Apple II 風罫線枠コンポーネント
- Create: `src/ui/components/Frame.css` — 罫線スタイル
- Test: `tests/ui/scale.test.ts`

### Phase D: ステートマシン + Zustand 基盤
- Create: `src/engine/state/types.ts` — GameState, GameEvent, SubState 型
- Create: `src/engine/state/reduce.ts` — トップ reducer (現時点で title のみ)
- Create: `src/engine/state/reduceTitle.ts` — Title phase の reducer
- Create: `src/engine/animation/orchestrator.ts` — bindAnimation (空実装)
- Create: `src/engine/effects/orchestrator.ts` — bindEffect, runEffect (現時点で空)
- Create: `src/store/gameStore.ts` — Zustand store with input queue, isBusy, isAnimating
- Create: `src/store/internalEventTypes.ts` — INTERNAL_EVENT_TYPES 定数
- Test: `tests/engine/state/reduceTitle.test.ts`
- Test: `tests/store/gameStore.test.ts`

### Phase E: 永続化レイヤースケルトン
- Create: `src/persist/schema.ts` — DBSchema 型 + DB_NAME, DB_VERSION
- Create: `src/persist/db.ts` — openWizardryDB(), 基本 API (init, getSetting, setSetting のみ)
- Test: `tests/persist/db.test.ts`

### Phase F: i18n 基盤
- Create: `src/i18n/messages.ts` — MESSAGES.{en, ja} (Title + 設定の最小セットのみ)
- Create: `src/i18n/useT.ts` — フック
- Create: `src/i18n/init.ts` — navigator.language → 初期 lang 決定
- Test: `tests/i18n/useT.test.tsx`

### Phase G: Title 画面
- Create: `src/screens/Title/index.tsx` — Title コンポーネント
- Create: `src/screens/Title/Title.css` — Apple II 風スタイル
- Create: `src/screens/Title/Logo.tsx` — Apple II 風 Wizardry ロゴ (ASCII art)
- Test: `tests/screens/Title.test.tsx`

### Phase H: CI/CD + Vercel デプロイ
- Create: `.github/workflows/ci.yml` — pnpm install → biome check → vitest run → vite build
- Create: `vercel.json` — 静的サイト設定 (build command, output dir)
- Create: `README.md` — プロジェクト概要・開発手順・デプロイ手順
- Create: `CHANGELOG.md` — Chapter 1 / M0 + M1 完了記録

---

## Phase A: M0 Pascal 抽出 (P50: 3 日 / P80: 6 日)

> **重要**: M0 は研究・データ作業中心。コード生成は後段 Phase で行う。実行前に CiderPress (Windows) または AppleCommander (Java) のいずれかをローカルにインストールしておくこと。

### Task A1: 抽出環境準備

**Files:**
- Create: `docs/reference/wiz1/README.md`

- [ ] **Step A1.1: README を作成**

```markdown
# Wizardry I (Apple II 1981) 参照資料

## 抽出元
- [snafaru/Wizardry.Code](https://github.com/snafaru/Wizardry.Code)
- 対象: `Wiz1A.DSK`, `Wiz1B.DSK`, `Wiz1C.DSK`, `Wiz1D.DSK`, `Wiz1E.DSK`

## 抽出ツール
- 推奨: [CiderPress II](https://github.com/fadden/ciderpress2) (Windows / Mac / Linux)
- 代替: [AppleCommander](https://applecommander.github.io/)

## 抽出手順
1. リポジトリをクローン: `git clone https://github.com/snafaru/Wizardry.Code.git`
2. `cipher.exe` (CiderPress II CLI) で `.DSK` を開き、Pascal Volume の `.TEXT` ファイルを抽出
3. 抽出した `.TEXT` ファイルを `pascal-sources/` 配下に配置 (元ファイル名を保持)
4. UCSD Pascal の改行は CR (0x0D) なので、必要なら LF に変換

## 二次ソース (Pascal 抽出失敗時のフォールバック)
- [tk421 Wizardry Maps](https://www.tk421.net/wizardry/wiz1maps.shtml)
- [Wizardry Wiki](https://wizardry.wiki.gg/)
- 1981 マニュアル (Internet Archive で公開されている)
```

- [ ] **Step A1.2: コミット**

```bash
git add docs/reference/wiz1/README.md
git commit -m "docs(reference): add Pascal extraction guide"
```

### Task A2: CiderPress 抽出ヘルパースクリプト

**Files:**
- Create: `scripts/extract-dsk.ps1`

- [ ] **Step A2.1: PowerShell スクリプトを作成**

```powershell
# scripts/extract-dsk.ps1
# Wraps CiderPress II CLI (cipher.exe) to extract all .TEXT files from a .DSK to a target folder.
# Usage: .\extract-dsk.ps1 -DskPath C:\path\to\Wiz1A.DSK -OutDir docs\reference\wiz1\pascal-sources\Wiz1A
param(
  [Parameter(Mandatory)] [string]$DskPath,
  [Parameter(Mandatory)] [string]$OutDir,
  [string]$CipherExe = "cipher.exe"
)

if (!(Test-Path $DskPath)) { throw "DSK not found: $DskPath" }
New-Item -ItemType Directory -Force -Path $OutDir | Out-Null

# List Pascal text files
& $CipherExe list $DskPath | Where-Object { $_ -match "\.TEXT" } | ForEach-Object {
  $name = ($_ -split "\s+")[0]
  & $CipherExe extract $DskPath $name (Join-Path $OutDir $name)
  Write-Host "Extracted: $name"
}
```

- [ ] **Step A2.2: コミット**

```bash
git add scripts/extract-dsk.ps1
git commit -m "feat(scripts): add CiderPress extraction helper"
```

### Task A3: Pascal ソースの抽出と配置

> **手作業フェーズ**: 各自の環境で CiderPress II をセットアップし、5 枚の DSK から `.TEXT` を抽出する。この作業はリポジトリ外で実施し、結果のみコミットする。

- [ ] **Step A3.1: snafaru/Wizardry.Code をローカルにクローン (リポジトリ外)**

```bash
git clone https://github.com/snafaru/Wizardry.Code.git ~/wizardry-source
```

- [ ] **Step A3.2: CiderPress II CLI をインストール**

[GitHub Releases](https://github.com/fadden/ciderpress2/releases) から最新の `cipher.exe` (Windows) または `cipher` をダウンロードし、PATH に追加。

- [ ] **Step A3.3: DSK から抽出**

```powershell
.\scripts\extract-dsk.ps1 -DskPath ~/wizardry-source/Wiz1A.DSK -OutDir docs/reference/wiz1/pascal-sources/Wiz1A
.\scripts\extract-dsk.ps1 -DskPath ~/wizardry-source/Wiz1B.DSK -OutDir docs/reference/wiz1/pascal-sources/Wiz1B
.\scripts\extract-dsk.ps1 -DskPath ~/wizardry-source/Wiz1C.DSK -OutDir docs/reference/wiz1/pascal-sources/Wiz1C
.\scripts\extract-dsk.ps1 -DskPath ~/wizardry-source/Wiz1D.DSK -OutDir docs/reference/wiz1/pascal-sources/Wiz1D
.\scripts\extract-dsk.ps1 -DskPath ~/wizardry-source/Wiz1E.DSK -OutDir docs/reference/wiz1/pascal-sources/Wiz1E
```

抽出失敗（CiderPress が UCSD Pascal Volume を認識しない等）の場合は AppleCommander を試し、それもダメなら本タスクをスキップして二次ソースに切り替える (open-questions.md に記録)。

- [ ] **Step A3.4: 抽出物をコミット**

抽出に成功した場合のみ:

```bash
git add docs/reference/wiz1/pascal-sources/
git commit -m "docs(reference): extract Pascal sources from Wizardry.Code DSK"
```

### Task A4: 抽出ログの作成

**Files:**
- Create: `docs/reference/wiz1/extraction-log.md`

- [ ] **Step A4.1: ログを作成**

抽出時に行った作業・遭遇した問題・解決策を記録する。例:

```markdown
# Pascal 抽出ログ

## 2026-05-04 初回抽出
- CiderPress II v1.0.0 を使用
- Wiz1A.DSK: 成功 / 17 ファイル抽出 (DEFINITIONS.TEXT, GLOBAL.TEXT, MAINUNIT.TEXT 等)
- Wiz1B.DSK: 成功 / 12 ファイル
- ...

## 課題
- (例) WIZARDRY.CODE はバイナリ部分を含むため、コードセグメント抽出には別途解読が必要
- (例) MAZEDATA は専用フォーマットでテキストではない → tk421 から人手書き起こし
```

- [ ] **Step A4.2: コミット**

```bash
git add docs/reference/wiz1/extraction-log.md
git commit -m "docs(reference): log extraction process"
```

### Task A5: races.md - 種族データの解読

**Files:**
- Create: `docs/reference/wiz1/data-tables/races.md`

- [ ] **Step A5.1: Pascal の RACES 配列を読解して Markdown 表に起こす**

該当する `.TEXT` ファイル (おそらく `GLOBAL.TEXT` や `DEFINITIONS.TEXT`) で `RACES` または race 関連の定数を探し、以下のフォーマットで記録:

```markdown
# RACES データ表

**Source:** `pascal-sources/Wiz1A/GLOBAL.TEXT` lines XX-YY (実際の行番号を記入)

| Race    | STR | IQ  | PIE | VIT | AGI | LUK |
|---------|-----|-----|-----|-----|-----|-----|
| Human   | 8   | 8   | 5   | 8   | 8   | 9   |
| Elf     | 7   | 10  | 10  | 6   | 9   | 6   |
| Dwarf   | 10  | 7   | 10  | 10  | 5   | 6   |
| Gnome   | 7   | 7   | 10  | 8   | 10  | 7   |
| Hobbit  | 5   | 7   | 7   | 6   | 10  | 15  |

## 検証メモ
- 数値は Pascal から 1:1 で書き起こし、補完なし
- 出典: Pascal の `RACE_BASE_ATTRS` 定数 (実際の名前を記入)

## 不明点
- 種族別の HP 計算式は別途確認 (open-questions.md 参照)
```

抽出失敗時はフォールバックとして [Wizardry Wiki: Race](https://wizardry.wiki.gg/wiki/Race) の Wizardry I 値を使用し、出典を明記する。

- [ ] **Step A5.2: コミット**

```bash
git add docs/reference/wiz1/data-tables/races.md
git commit -m "docs(reference): document RACES data table from Pascal"
```

### Task A6: classes.md - 職業データの解読

**Files:**
- Create: `docs/reference/wiz1/data-tables/classes.md`

- [ ] **Step A6.1: Pascal の CLASSES と CLASS_REQUIREMENTS を解読**

```markdown
# CLASSES データ表

**Source:** `pascal-sources/Wiz1?/?.TEXT` lines XX-YY

## 職業条件 (能力値最低値・属性制限)

| Class   | STR | IQ  | PIE | VIT | AGI | LUK | Alignment |
|---------|-----|-----|-----|-----|-----|-----|-----------|
| Fighter | 11  | -   | -   | -   | -   | -   | Any       |
| Mage    | -   | 11  | -   | -   | -   | -   | Any       |
| Priest  | -   | -   | 11  | -   | -   | -   | Good/Evil |
| Thief   | -   | -   | -   | -   | 11  | -   | Neutral/Evil |
| Bishop  | -   | 12  | 12  | -   | -   | -   | Good/Evil |
| Samurai | 15  | 11  | 10  | 14  | 10  | -   | Good/Neutral |
| Lord    | 15  | 12  | 12  | 15  | 14  | 15  | Good      |
| Ninja   | 17  | 17  | 17  | 17  | 17  | 17  | Evil      |

## 各職業の HD / 呪文使用可否 / 武器制限 等
(Pascal の関連レコードを書き起こす)

## 不明点
- 職業変更時の能力値・経験値リセットルール (open-questions.md 参照)
```

- [ ] **Step A6.2: コミット**

```bash
git add docs/reference/wiz1/data-tables/classes.md
git commit -m "docs(reference): document CLASSES data and qualification rules"
```

### Task A7: items.md - Chapter 1 装備の解読

**Files:**
- Create: `docs/reference/wiz1/data-tables/items.md`

- [ ] **Step A7.1: Boltac で Chapter 1 に登場する装備のみ抽出**

戦闘実装が Chapter 2 以降のため、Chapter 1 では「数値表示のみ・効果未反映」の装備リストで十分。Pascal の ITEMS 配列から **武器・防具・盾・兜の Lv1 装備** を抜粋:

```markdown
# ITEMS データ表 (Chapter 1 範囲)

**Source:** `pascal-sources/Wiz1?/?.TEXT` lines XX-YY

| ID  | Name (EN)        | Name (JA)        | Type    | Cost | AC/Damage | Class Restriction |
|-----|------------------|------------------|---------|------|-----------|-------------------|
| 1   | Long Sword       | ロングソード      | Weapon  | 25   | 1d8       | F/S/L/N           |
| 2   | Short Sword      | ショートソード    | Weapon  | 15   | 1d6       | F/S/L/T/N         |
| 3   | Staff            | スタッフ          | Weapon  | 5    | 1d6       | M/P/B             |
| ... |                  |                  |         |      |           |                   |
| 30  | Leather Armor    | レザーアーマー    | Armor   | 50   | -2 AC     | F/S/L/N           |
| ... |                  |                  |         |      |           |                   |

## 範囲
- Lv1 装備のみ (Chapter 1 で買える / 戦闘なし)
- 識別済み名 / 未識別名は Chapter 4 で実装
```

- [ ] **Step A7.2: コミット**

```bash
git add docs/reference/wiz1/data-tables/items.md
git commit -m "docs(reference): document level-1 items for Chapter 1"
```

### Task A8: maze-l1.md - 迷宮 1F の解読

**Files:**
- Create: `docs/reference/wiz1/data-tables/maze-l1.md`

- [ ] **Step A8.1: MAZEDATA を解読 OR tk421 から書き起こす**

```markdown
# MAZE Level 1 データ

**Source:** Pascal MAZEDATA (バイナリ形式) → 解読困難な場合は [tk421 Wizardry Maps](https://www.tk421.net/wizardry/wiz1maps.shtml) を使用

## 形式
- 20×20 グリッド
- 各セルに north/east/south/west の壁/扉/秘密扉/開放
- 特殊マス: stairsUp / stairsDown / message / darkness / spinner / teleport

## L1 の特徴 (tk421 参照)
- 開始位置: (0, 0) で北向き
- 上り階段: (0, 0) (= 開始位置から城へ戻る)
- 下り階段: (X, Y) (B2F へ - Chapter 1 では機能しない)
- 暗闇マス: 数か所 (Chapter 1 では効果なし)
- 回転床: なし (L1)
- メッセージ: なし (L1)

## セルデータ (CSV 形式 - 後で TS に変換)
```
x,y,n,e,s,w,special,messageId
0,0,wall,door,wall,wall,stairsUp,
0,1,wall,wall,door,wall,none,
...
```

## 不明点
- 北壁の正規化 (隣接セル間の整合性) は実装時にスクリプトで検証
```

人力で 20×20 = 400 セル分書き起こすのは半日仕事。tk421 の地図画像を見て手作業で起こす。

- [ ] **Step A8.2: コミット**

```bash
git add docs/reference/wiz1/data-tables/maze-l1.md
git commit -m "docs(reference): document Maze Level 1 cell data"
```

### Task A9: character-creation.md - キャラ作成アルゴリズムの解読

**Files:**
- Create: `docs/reference/wiz1/algorithms/character-creation.md`

- [ ] **Step A9.1: MAKECHARACTER プロシージャを TypeScript 風疑似コードに翻訳**

```markdown
# キャラクター作成アルゴリズム

**Source:** `pascal-sources/Wiz1?/MAKECHARACTER.TEXT` (実ファイル名)

## ボーナスポイント計算 (BONUS プロシージャ)

```
function rollBonus(rng) {
  let bonus = 5 + rng.nextInt(0, 9);  // 5..14 の一様分布
  // 確率 1/10 で +10 ボーナス追加 (極めて稀な高ロール)
  if (rng.nextInt(0, 9) === 0) bonus += 10;
  // さらに 1/10 で連鎖
  if (rng.nextInt(0, 9) === 0) bonus += 10;
  return bonus;
}
```

(↑ 実際の Pascal を読んで正確な式を書く。これは仮の例)

## 振り分けルール
- 各能力値の上限は 18
- 種族 base 値から始まり、ボーナスを +1/-1 で振り分け
- 全ポイント振り終わるまで職業選択不可

## 職業判定
- 振り分け後の能力値で資格チェック
- 資格のある職業のみ選択肢に表示
- 資格がなければ「振り直し」を提案

## 不明点
- HP の初期値計算式
- レベル 1 時点の MP 計算
```

- [ ] **Step A9.2: コミット**

```bash
git add docs/reference/wiz1/algorithms/character-creation.md
git commit -m "docs(reference): document character creation algorithm"
```

### Task A10: open-questions.md - 不明点の管理

**Files:**
- Create: `docs/chapters/1/open-questions.md`

- [ ] **Step A10.1: 解読中に発見した不明点をリスト化**

```markdown
# Chapter 1 - Open Questions

未確定項目を一元管理する。実装時に判断が必要になったら参照する。

## 抽出関連
- [ ] Q-001: WIZARDRY.CODE のコードセグメントが抽出できなかった場合、職業条件・呪文効果は二次ソースで埋める。優先順は (1) Pascal 一致疑い箇所のスポット解読 (2) Wizardry Wiki (3) 1981 マニュアル

## キャラクター作成
- [ ] Q-002: ボーナスポイントの正確な分布式 (Pascal BONUS プロシージャを要再確認)
- [ ] Q-003: 能力値上限が 18 で正しいか (種族別に違う可能性?)
- [ ] Q-004: HP 初期値計算式 (Chapter 2 で着手するが M3 でも参照する可能性あり)

## 迷宮
- [ ] Q-005: Edge 正規化の自動チェックスクリプトが必要か (M4 で検討)
- [ ] Q-006: L1 の暗闇マス座標 (tk421 で確認済みか)

## 戦闘・呪文 (Chapter 2 以降)
- (Chapter 2 開始時に追加)

## 解決済
(解決した Q を移動して履歴を残す)
```

- [ ] **Step A10.2: コミット**

```bash
mkdir -p docs/chapters/1
git add docs/chapters/1/open-questions.md
git commit -m "docs(chapters): start Chapter 1 open questions log"
```

---

## Phase B: M1 プロジェクトスケルトン (P50: 0.5 日 / P80: 1 日)

### Task B1: package.json と pnpm セットアップ

**Files:**
- Create: `package.json`
- Create: `.gitignore`

- [ ] **Step B1.1: package.json を作成**

```json
{
  "name": "wizardry-proving-grounds",
  "version": "0.0.1",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc -b && vite build",
    "preview": "vite preview",
    "test": "vitest run",
    "test:watch": "vitest",
    "lint": "biome check src tests",
    "format": "biome format --write src tests",
    "typecheck": "tsc --noEmit"
  },
  "dependencies": {
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "zustand": "^4.5.5",
    "idb": "^8.0.0"
  },
  "devDependencies": {
    "@biomejs/biome": "^1.9.4",
    "@testing-library/jest-dom": "^6.6.3",
    "@testing-library/react": "^16.0.1",
    "@types/react": "^18.3.12",
    "@types/react-dom": "^18.3.1",
    "@vitejs/plugin-react": "^4.3.4",
    "fake-indexeddb": "^6.0.0",
    "jsdom": "^25.0.1",
    "typescript": "^5.6.3",
    "vite": "^5.4.11",
    "vitest": "^2.1.5"
  },
  "packageManager": "pnpm@9.12.3"
}
```

- [ ] **Step B1.2: .gitignore を作成**

```
node_modules/
dist/
.vercel/
.DS_Store
*.log
coverage/
.vite/
```

- [ ] **Step B1.3: pnpm install**

```bash
pnpm install
```

期待: `node_modules/` が作成される。エラーなし。

- [ ] **Step B1.4: コミット**

```bash
git add package.json pnpm-lock.yaml .gitignore
git commit -m "chore: initialize pnpm project with React 18 + Vite + idb + Zustand"
```

### Task B2: TypeScript 設定

**Files:**
- Create: `tsconfig.json`
- Create: `tsconfig.node.json`
- Create: `src/vite-env.d.ts`

- [ ] **Step B2.1: tsconfig.json**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "useDefineForClassFields": true,
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": false,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "noUncheckedIndexedAccess": true,
    "exactOptionalPropertyTypes": true,
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"]
    },
    "types": ["vitest/globals", "@testing-library/jest-dom"]
  },
  "include": ["src", "tests"],
  "references": [{ "path": "./tsconfig.node.json" }]
}
```

- [ ] **Step B2.2: tsconfig.node.json**

```json
{
  "compilerOptions": {
    "composite": true,
    "skipLibCheck": true,
    "module": "ESNext",
    "moduleResolution": "bundler",
    "allowSyntheticDefaultImports": true,
    "strict": true
  },
  "include": ["vite.config.ts", "vitest.config.ts"]
}
```

- [ ] **Step B2.3: src/vite-env.d.ts**

```typescript
/// <reference types="vite/client" />
```

- [ ] **Step B2.4: pnpm typecheck で確認**

```bash
pnpm typecheck
```

期待: エラーなし (まだ src/ にコードがないので空成功)。

- [ ] **Step B2.5: コミット**

```bash
git add tsconfig.json tsconfig.node.json src/vite-env.d.ts
git commit -m "chore: configure TypeScript strict mode + path alias"
```

### Task B3: Vite 設定

**Files:**
- Create: `vite.config.ts`
- Create: `index.html`

- [ ] **Step B3.1: vite.config.ts**

```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    target: 'es2022',
    sourcemap: true,
  },
});
```

- [ ] **Step B3.2: index.html**

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Wizardry Proving Grounds</title>
  </head>
  <body style="margin: 0; background: black;">
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

- [ ] **Step B3.3: コミット**

```bash
git add vite.config.ts index.html
git commit -m "chore: add Vite config and entry HTML"
```

### Task B4: Biome 設定

**Files:**
- Create: `biome.json`

- [ ] **Step B4.1: biome.json**

```json
{
  "$schema": "https://biomejs.dev/schemas/1.9.4/schema.json",
  "organizeImports": { "enabled": true },
  "linter": {
    "enabled": true,
    "rules": {
      "recommended": true,
      "style": {
        "useImportType": "error",
        "noNonNullAssertion": "warn"
      },
      "suspicious": {
        "noExplicitAny": "error"
      }
    }
  },
  "formatter": {
    "enabled": true,
    "indentStyle": "space",
    "indentWidth": 2,
    "lineWidth": 100
  },
  "files": {
    "include": ["src/**/*", "tests/**/*"],
    "ignore": ["node_modules", "dist", "coverage"]
  }
}
```

- [ ] **Step B4.2: コミット**

```bash
git add biome.json
git commit -m "chore: configure Biome for linting and formatting"
```

### Task B5: Vitest 設定

**Files:**
- Create: `vitest.config.ts`
- Create: `tests/setup.ts`

- [ ] **Step B5.1: vitest.config.ts**

```typescript
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'node:path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./tests/setup.ts'],
  },
});
```

- [ ] **Step B5.2: tests/setup.ts**

```typescript
import '@testing-library/jest-dom/vitest';
import 'fake-indexeddb/auto';
```

- [ ] **Step B5.3: pnpm test で確認**

```bash
pnpm test
```

期待: "No test files found" 系のメッセージ。エラーなし。

- [ ] **Step B5.4: コミット**

```bash
git add vitest.config.ts tests/setup.ts
git commit -m "chore: configure Vitest with jsdom and fake-indexeddb"
```

---

## Phase C: Apple II UI 基盤 (P50: 1 日 / P80: 2 日)

### Task C1: フォントファイルの取得と配置

**Files:**
- Create: `public/fonts/PrintChar21.ttf`
- Create: `public/fonts/MisakiGothic.ttf`
- Create: `public/fonts/LICENSE.md`

- [ ] **Step C1.1: Print Char 21 をダウンロード**

[Kreative Software - Print Char 21](http://www.kreativekorp.com/software/fonts/apple2.shtml) からダウンロードし、`public/fonts/PrintChar21.ttf` に配置。

- [ ] **Step C1.2: 美咲フォントをダウンロード**

[美咲フォント](https://littlelimit.net/misaki.htm) (門田暁人氏作、フリー) からダウンロードし、`public/fonts/MisakiGothic.ttf` に配置。

- [ ] **Step C1.3: ライセンス情報を記録**

```markdown
# Font Licenses

## Print Char 21
- 作者: Kreative Software / Rebecca Bettencourt
- ライセンス: 詳細は [Kreative Software fonts](http://www.kreativekorp.com/software/fonts/apple2.shtml) で確認
- 用途: Apple II 風英語フォント

## 美咲フォント (Misaki Gothic)
- 作者: 門田暁人 (Akihito Kadota)
- ライセンス: 自由配布可 (要 [公式サイト](https://littlelimit.net/misaki.htm) 参照)
- 用途: 8x8 ピクセル日本語フォント
```

- [ ] **Step C1.4: ライセンス確認 (重要)**

両フォントとも「自由配布可」を確認。商用利用条件に注意 (本プロジェクトは非営利)。問題があれば代替フォントへの差し替えを検討 (open-questions.md に記録)。

- [ ] **Step C1.5: コミット**

```bash
git add public/fonts/
git commit -m "feat(ui): add Apple II + Misaki Gothic pixel fonts with licenses"
```

### Task C2: ui/scale.ts のテスト先行実装

**Files:**
- Create: `tests/ui/scale.test.ts`

- [ ] **Step C2.1: テストを先に書く**

```typescript
// tests/ui/scale.test.ts
import { describe, it, expect } from 'vitest';
import { computeScale } from '@/ui/scale';

describe('computeScale', () => {
  it.each([
    [1920, 1080, 5],   // FHD: 1080/192=5.625, 1920/280=6.85 → min(6,5)=5
    [1280, 720,  3],   // 720/192=3.75, 1280/280=4.57 → min(4,3)=3
    [800,  600,  2],   // 600/192=3.125, 800/280=2.85 → min(2,3)=2
    [560,  384,  2],   // ぴったり 2x
    [280,  192,  1],   // ぴったり 1x
    [200,  100,  1],   // 小さすぎ → min 1
  ])('computeScale(%i, %i) === %i', (w, h, expected) => {
    expect(computeScale(w, h)).toBe(expected);
  });
});
```

- [ ] **Step C2.2: テスト実行 (失敗確認)**

```bash
pnpm test
```

期待: `Cannot find module '@/ui/scale'`

### Task C3: ui/scale.ts を実装

**Files:**
- Create: `src/ui/scale.ts`

- [ ] **Step C3.1: 最小実装**

```typescript
// src/ui/scale.ts

/**
 * ウィンドウサイズから Apple II 仮想ピクセル (280×192) の整数倍スケールを計算する。
 * 最小 1x, 最大 (画面に収まる範囲)。
 */
export function computeScale(winWidth: number, winHeight: number): number {
  const sx = Math.floor(winWidth / 280);
  const sy = Math.floor(winHeight / 192);
  return Math.max(1, Math.min(sx, sy));
}

/**
 * ブラウザの resize イベントを購読し、--scale CSS 変数を更新する。
 * アプリ起動時に 1 度呼び出して購読を開始する。
 */
export function subscribeScaleToWindow(): () => void {
  const apply = () => {
    const s = computeScale(window.innerWidth, window.innerHeight);
    document.documentElement.style.setProperty('--scale', String(s));
  };
  apply();
  window.addEventListener('resize', apply);
  return () => window.removeEventListener('resize', apply);
}
```

- [ ] **Step C3.2: テスト再実行**

```bash
pnpm test
```

期待: PASS (computeScale テスト 6 ケース全て)

- [ ] **Step C3.3: コミット**

```bash
git add src/ui/scale.ts tests/ui/scale.test.ts
git commit -m "feat(ui): add computeScale + window subscription"
```

### Task C4: global.css に Apple II 仮想ピクセルグリッドを定義

**Files:**
- Create: `src/ui/global.css`

- [ ] **Step C4.1: global.css**

```css
/* src/ui/global.css */

@font-face {
  font-family: 'Print Char 21';
  src: url('/fonts/PrintChar21.ttf') format('truetype');
  font-display: block;  /* フォントロード前は描画しない (FOUT 回避) */
}

@font-face {
  font-family: 'Misaki Gothic';
  src: url('/fonts/MisakiGothic.ttf') format('truetype');
  font-display: block;
}

:root {
  --scale: 3;                                    /* JS で動的更新 */
  --vp: calc(1px * var(--scale));                /* 仮想ピクセル単位 */
  --viewport-width:  calc(280 * var(--vp));
  --viewport-height: calc(192 * var(--vp));
  --font-size-glyph: calc(8 * var(--vp));
  --color-bg: #000000;
  --color-fg: #ffffff;
  --color-accent: #00ff00;       /* HGR グリーン */
  --color-warn:   #ff8000;       /* HGR オレンジ */
  font-family: 'Print Char 21', 'Misaki Gothic', monospace;
  font-size: var(--font-size-glyph);
  line-height: var(--font-size-glyph);
  color: var(--color-fg);
  background: var(--color-bg);
}

[lang='ja'] :root {
  font-family: 'Misaki Gothic', 'Print Char 21', monospace;
}

* {
  box-sizing: border-box;
  -webkit-font-smoothing: none;
  font-smooth: never;
}

html, body {
  margin: 0;
  padding: 0;
  height: 100%;
  background: var(--color-bg);
  overflow: hidden;
}

#root {
  width: var(--viewport-width);
  height: var(--viewport-height);
  position: relative;
  margin: auto;
  display: block;
  /* ウィンドウ中央配置 */
}

body {
  display: flex;
  align-items: center;
  justify-content: center;
}

img, canvas {
  image-rendering: pixelated;
  image-rendering: crisp-edges;
}
```

- [ ] **Step C4.2: コミット**

```bash
git add src/ui/global.css
git commit -m "feat(ui): define Apple II virtual pixel grid (--vp) CSS"
```

### Task C5: フォントロード待ち (FOUT 回避)

**Files:**
- Modify: `src/ui/scale.ts` (フォントロード API 追加)

- [ ] **Step C5.1: フォントロードヘルパーを scale.ts に追加**

```typescript
// scale.ts の末尾に追記

/**
 * Apple II 風 Web フォントが両方ロードされるまで待つ。
 * FOUT (Flash of Unstyled Text) を防ぐため、アプリ起動前に呼ぶ。
 */
export async function waitForPixelFontsReady(): Promise<void> {
  if (!('fonts' in document)) return;            // 古いブラウザ: フォールバック
  // load() を呼ぶことでロードを促す
  await Promise.all([
    document.fonts.load('1em "Print Char 21"'),
    document.fonts.load('1em "Misaki Gothic"'),
  ]);
  await document.fonts.ready;
}
```

- [ ] **Step C5.2: コミット**

```bash
git add src/ui/scale.ts
git commit -m "feat(ui): add waitForPixelFontsReady to avoid FOUT"
```

### Task C6: Frame コンポーネント (Apple II 風罫線枠)

**Files:**
- Create: `src/ui/components/Frame.tsx`
- Create: `src/ui/components/Frame.css`
- Test: `tests/ui/components/Frame.test.tsx`

- [ ] **Step C6.1: テストを先に書く**

```typescript
// tests/ui/components/Frame.test.tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Frame } from '@/ui/components/Frame';

describe('<Frame>', () => {
  it('renders children inside a framed div', () => {
    render(<Frame title="MENU"><p>Hello</p></Frame>);
    expect(screen.getByText('MENU')).toBeInTheDocument();
    expect(screen.getByText('Hello')).toBeInTheDocument();
  });

  it('has the apple2-frame class', () => {
    const { container } = render(<Frame><span /></Frame>);
    expect(container.querySelector('.apple2-frame')).not.toBeNull();
  });
});
```

- [ ] **Step C6.2: テスト実行 (失敗確認)**

```bash
pnpm test Frame
```

期待: モジュールが見つからない

- [ ] **Step C6.3: Frame.tsx 実装**

```typescript
// src/ui/components/Frame.tsx
import type { ReactNode } from 'react';
import './Frame.css';

interface FrameProps {
  title?: string;
  children: ReactNode;
}

export function Frame({ title, children }: FrameProps) {
  return (
    <div className="apple2-frame">
      {title && <div className="apple2-frame-title">{title}</div>}
      <div className="apple2-frame-body">{children}</div>
    </div>
  );
}
```

- [ ] **Step C6.4: Frame.css 実装**

```css
/* src/ui/components/Frame.css */
.apple2-frame {
  border: var(--vp) solid var(--color-fg);
  padding: calc(2 * var(--vp));
  background: var(--color-bg);
}

.apple2-frame-title {
  font-size: var(--font-size-glyph);
  margin-bottom: calc(1 * var(--vp));
  text-align: center;
  letter-spacing: var(--vp);
}

.apple2-frame-body {
  font-size: var(--font-size-glyph);
}
```

- [ ] **Step C6.5: テスト再実行**

```bash
pnpm test Frame
```

期待: PASS

- [ ] **Step C6.6: コミット**

```bash
git add src/ui/components/Frame.tsx src/ui/components/Frame.css tests/ui/components/Frame.test.tsx
git commit -m "feat(ui): add Apple II style Frame component"
```

---

## Phase D: ステートマシン + Zustand 基盤 (P50: 1 日 / P80: 1.5 日)

### Task D1: GameState / GameEvent 型定義

**Files:**
- Create: `src/engine/state/types.ts`

- [ ] **Step D1.1: 型定義を作成**

```typescript
// src/engine/state/types.ts

// 言語
export type Lang = 'en' | 'ja';

// SaveSlot 識別子
export type SaveSlotId = number;
export interface SaveSlotInfo {
  id: SaveSlotId;
  name: string;
  updatedAt: number;
}

// Title 画面の sub-state
export type TitleSubState =
  | { kind: 'main' }
  | { kind: 'continueMenu'; slots: SaveSlotInfo[] }
  | { kind: 'loading'; slotId: SaveSlotId }
  | { kind: 'loadError'; reason: string }
  | { kind: 'settings' };

// Chapter 1 では title phase のみ実装。他 phase は M2 以降で追加。
export type GameState =
  | { phase: 'title'; sub: TitleSubState };

// イベント (Chapter 1 / M1 範囲のみ)
export type GameEvent =
  | { type: 'startGame' }
  | { type: 'openContinue' }
  | { type: 'openSettings' }
  | { type: 'closeSettings' }
  | { type: 'changeLanguage'; lang: Lang }
  // 非同期ライフサイクル (M5 で本格実装)
  | { type: 'loadStarted'; slotId: SaveSlotId }
  | { type: 'loadFailed'; reason: string };

// 副作用
export type Effect =
  | { type: 'load'; slotId: SaveSlotId };
```

- [ ] **Step D1.2: typecheck**

```bash
pnpm typecheck
```

期待: エラーなし

- [ ] **Step D1.3: コミット**

```bash
git add src/engine/state/types.ts
git commit -m "feat(engine): define GameState/GameEvent types for M1"
```

### Task D2: reduceTitle のテスト先行実装

**Files:**
- Create: `tests/engine/state/reduceTitle.test.ts`

- [ ] **Step D2.1: テストを先に書く**

```typescript
// tests/engine/state/reduceTitle.test.ts
import { describe, it, expect } from 'vitest';
import { reduce } from '@/engine/state/reduce';
import type { GameState, GameEvent } from '@/engine/state/types';

const initial: GameState = { phase: 'title', sub: { kind: 'main' } };

describe('title phase reducer', () => {
  it('openContinue from main → continueMenu (with empty slots placeholder)', () => {
    const next = reduce(initial, { type: 'openContinue' });
    expect(next).toEqual({ phase: 'title', sub: { kind: 'continueMenu', slots: [] } });
  });

  it('openSettings from main → settings', () => {
    const next = reduce(initial, { type: 'openSettings' });
    expect(next).toEqual({ phase: 'title', sub: { kind: 'settings' } });
  });

  it('closeSettings from settings → main', () => {
    const fromSettings: GameState = { phase: 'title', sub: { kind: 'settings' } };
    const next = reduce(fromSettings, { type: 'closeSettings' });
    expect(next).toEqual({ phase: 'title', sub: { kind: 'main' } });
  });

  it('loadFailed from loading → loadError', () => {
    const fromLoading: GameState = { phase: 'title', sub: { kind: 'loading', slotId: 1 } };
    const next = reduce(fromLoading, { type: 'loadFailed', reason: 'corrupted' });
    expect(next).toEqual({ phase: 'title', sub: { kind: 'loadError', reason: 'corrupted' } });
  });

  it('unknown event returns same state', () => {
    const next = reduce(initial, { type: 'startGame' as const });
    // Chapter 1 / M1 では startGame は未実装なので state 不変
    expect(next).toEqual(initial);
  });
});
```

- [ ] **Step D2.2: テスト実行 (失敗確認)**

```bash
pnpm test reduceTitle
```

期待: モジュールが見つからない

### Task D3: reduce.ts と reduceTitle.ts 実装

**Files:**
- Create: `src/engine/state/reduce.ts`
- Create: `src/engine/state/reduceTitle.ts`

- [ ] **Step D3.1: reduceTitle.ts**

```typescript
// src/engine/state/reduceTitle.ts
import type { GameState, GameEvent } from './types';

export function reduceTitle(state: GameState & { phase: 'title' }, event: GameEvent): GameState {
  const { sub } = state;

  switch (event.type) {
    case 'openContinue':
      // M5 で実 slots を引くようになる。M1 では空配列で OK
      return { phase: 'title', sub: { kind: 'continueMenu', slots: [] } };

    case 'openSettings':
      return { phase: 'title', sub: { kind: 'settings' } };

    case 'closeSettings':
      if (sub.kind === 'settings') {
        return { phase: 'title', sub: { kind: 'main' } };
      }
      return state;

    case 'loadFailed':
      if (sub.kind === 'loading') {
        return { phase: 'title', sub: { kind: 'loadError', reason: event.reason } };
      }
      return state;

    // M2 以降で実装
    case 'startGame':
    default:
      return state;
  }
}
```

- [ ] **Step D3.2: reduce.ts**

```typescript
// src/engine/state/reduce.ts
import type { GameState, GameEvent } from './types';
import { reduceTitle } from './reduceTitle';

export function reduce(state: GameState, event: GameEvent): GameState {
  switch (state.phase) {
    case 'title':
      return reduceTitle(state, event);
    default:
      return state;
  }
}
```

- [ ] **Step D3.3: テスト実行**

```bash
pnpm test reduceTitle
```

期待: PASS (5 ケース)

- [ ] **Step D3.4: コミット**

```bash
git add src/engine/state/reduce.ts src/engine/state/reduceTitle.ts tests/engine/state/reduceTitle.test.ts
git commit -m "feat(engine): implement title-phase reducer with TDD"
```

### Task D4: animation/effects orchestrator スタブ

**Files:**
- Create: `src/engine/animation/orchestrator.ts`
- Create: `src/engine/effects/orchestrator.ts`
- Create: `src/store/internalEventTypes.ts`

- [ ] **Step D4.1: animation/orchestrator.ts**

```typescript
// src/engine/animation/orchestrator.ts
import type { GameState } from '../state/types';

export type AnimationKind = 'fade' | 'mazeStep' | 'mazeTurn' | 'doorOpen' | 'messageOpen' | 'messageClose';

export const ANIM_DURATION: Record<AnimationKind, number> = {
  fade: 300,
  mazeStep: 150,
  mazeTurn: 200,
  doorOpen: 250,
  messageOpen: 100,
  messageClose: 100,
};

/**
 * 状態遷移からアニメーション種別を決定する。
 * M1 では animations は実質的に発火しない (title phase のみのため)。
 */
export function bindAnimation(_prev: GameState, _next: GameState): AnimationKind | null {
  return null;
}

export function runAnimation(kind: AnimationKind, onDone: () => void): void {
  const duration = ANIM_DURATION[kind];
  const start = performance.now();
  function tick(now: number): void {
    if (now - start >= duration) {
      onDone();
      return;
    }
    requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
}
```

- [ ] **Step D4.2: effects/orchestrator.ts**

```typescript
// src/engine/effects/orchestrator.ts
import type { GameState, GameEvent, Effect } from '../state/types';

/**
 * 状態遷移から副作用を決定する。
 * M1 では loading 遷移のみ。M5 で saving も追加。
 */
export function bindEffect(prev: GameState, next: GameState): Effect | null {
  if (
    next.phase === 'title' &&
    next.sub.kind === 'loading' &&
    !(prev.phase === 'title' && prev.sub.kind === 'loading')
  ) {
    return { type: 'load', slotId: next.sub.slotId };
  }
  return null;
}

/**
 * 副作用を実行し、完了時に内部イベントを dispatch する。
 * M1 では load ハンドラはスタブ (常に loadFailed を返す)。M5 で実装。
 */
export async function runEffect(
  effect: Effect,
  dispatch: (e: GameEvent) => void,
): Promise<void> {
  if (effect.type === 'load') {
    // M5 で db.loadState() を呼ぶ実装に置き換え
    dispatch({ type: 'loadFailed', reason: 'load not implemented yet' });
  }
}
```

- [ ] **Step D4.3: store/internalEventTypes.ts**

```typescript
// src/store/internalEventTypes.ts
import type { GameEvent } from '@/engine/state/types';

/**
 * 内部発火イベント (副作用ランナーが dispatch するもの)。
 * 入力キューを経由せず即時処理される。
 */
export const INTERNAL_EVENT_TYPES: ReadonlyArray<GameEvent['type']> = [
  'loadStarted',
  'loadFailed',
];
```

- [ ] **Step D4.4: typecheck**

```bash
pnpm typecheck
```

期待: エラーなし

- [ ] **Step D4.5: コミット**

```bash
git add src/engine/animation/orchestrator.ts src/engine/effects/orchestrator.ts src/store/internalEventTypes.ts
git commit -m "feat(engine): add animation/effect orchestrator scaffolding"
```

### Task D5: gameStore のテスト先行実装

**Files:**
- Create: `tests/store/gameStore.test.ts`

- [ ] **Step D5.1: テスト**

```typescript
// tests/store/gameStore.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { createGameStore } from '@/store/gameStore';

describe('gameStore', () => {
  let store: ReturnType<typeof createGameStore>;

  beforeEach(() => {
    store = createGameStore();
  });

  it('initial state is title.main', () => {
    expect(store.getState().state).toEqual({ phase: 'title', sub: { kind: 'main' } });
  });

  it('initial lang is en', () => {
    expect(store.getState().lang).toBe('en');
  });

  it('dispatch openSettings transitions to settings', () => {
    store.getState().dispatch({ type: 'openSettings' });
    expect(store.getState().state.sub).toEqual({ kind: 'settings' });
  });

  it('dispatch changeLanguage updates lang directly (bypasses reducer)', () => {
    store.getState().dispatch({ type: 'changeLanguage', lang: 'ja' });
    expect(store.getState().lang).toBe('ja');
    // state は変わらない
    expect(store.getState().state).toEqual({ phase: 'title', sub: { kind: 'main' } });
  });

  it('dispatch when isAnimating queues input', () => {
    // isAnimating を強制的に true に
    store.setState({ isAnimating: true });
    store.getState().dispatch({ type: 'openSettings' });
    expect(store.getState().state.sub).toEqual({ kind: 'main' }); // まだ未反映
    expect(store.getState().inputQueue).toHaveLength(1);
  });

  it('queue is bounded at MAX_QUEUED_INPUTS = 1', () => {
    store.setState({ isAnimating: true });
    store.getState().dispatch({ type: 'openSettings' });
    store.getState().dispatch({ type: 'openContinue' });   // 2 個目は捨てる
    store.getState().dispatch({ type: 'openSettings' });   // 3 個目も捨てる
    expect(store.getState().inputQueue).toHaveLength(1);
  });
});
```

- [ ] **Step D5.2: テスト実行 (失敗確認)**

```bash
pnpm test gameStore
```

期待: モジュールが見つからない

### Task D6: gameStore.ts 実装

**Files:**
- Create: `src/store/gameStore.ts`

- [ ] **Step D6.1: gameStore.ts**

```typescript
// src/store/gameStore.ts
import { createStore } from 'zustand/vanilla';
import { useStore } from 'zustand';
import { reduce } from '@/engine/state/reduce';
import { bindAnimation, runAnimation } from '@/engine/animation/orchestrator';
import { bindEffect, runEffect } from '@/engine/effects/orchestrator';
import { INTERNAL_EVENT_TYPES } from './internalEventTypes';
import type { GameState, GameEvent, Lang } from '@/engine/state/types';

const MAX_QUEUED_INPUTS = 1;
const QUEUE_TIMEOUT_MS = 5000;

export interface GameStoreShape {
  state: GameState;
  lang: Lang;
  scaleMode: 'auto' | 1 | 2 | 3 | 4;
  isAnimating: boolean;
  isBusy: boolean;
  inputQueue: GameEvent[];
  dispatch: (event: GameEvent) => void;
}

const initialState: Omit<GameStoreShape, 'dispatch'> = {
  state: { phase: 'title', sub: { kind: 'main' } },
  lang: 'en',
  scaleMode: 'auto',
  isAnimating: false,
  isBusy: false,
  inputQueue: [],
};

function flushQueue(get: () => GameStoreShape, set: (partial: Partial<GameStoreShape>) => void): void {
  const { isBusy, isAnimating, inputQueue } = get();
  if (isBusy || isAnimating) return;          // 冪等性: 両方 false でないと dequeue しない
  if (inputQueue.length === 0) return;
  const [head, ...rest] = inputQueue;
  set({ inputQueue: rest });
  if (head) {
    queueMicrotask(() => get().dispatch(head));
  }
}

export function createGameStore() {
  const store = createStore<GameStoreShape>((set, get) => ({
    ...initialState,

    dispatch: (event: GameEvent): void => {
      // 設定系イベントは Reducer をバイパス
      if (event.type === 'changeLanguage') {
        set({ lang: event.lang });
        // settings objectStore への永続化は M5 で追加
        return;
      }

      const isInternal = INTERNAL_EVENT_TYPES.includes(event.type);

      if (!isInternal && (get().isAnimating || get().isBusy)) {
        const queue = get().inputQueue;
        if (queue.length < MAX_QUEUED_INPUTS) {
          set({ inputQueue: [...queue, event] });
        }
        return;
      }

      const prev = get().state;
      const next = reduce(prev, event);
      const anim = bindAnimation(prev, next);
      const effect = bindEffect(prev, next);

      set({ state: next });

      if (effect) {
        set({ isBusy: true });
        const safetyTimer = setTimeout(() => {
          set({ isBusy: false, inputQueue: [] });
        }, QUEUE_TIMEOUT_MS);
        runEffect(effect, get().dispatch).finally(() => {
          clearTimeout(safetyTimer);
          set({ isBusy: false });
          flushQueue(get, set);
        });
      }

      if (anim) {
        set({ isAnimating: true });
        runAnimation(anim, () => {
          set({ isAnimating: false });
          flushQueue(get, set);
        });
      }
    },
  }));
  return store;
}

// シングルトン
export const gameStore = createGameStore();

// React 用フック
export function useGameStore<T>(selector: (s: GameStoreShape) => T): T {
  return useStore(gameStore, selector);
}
```

- [ ] **Step D6.2: テスト再実行**

```bash
pnpm test gameStore
```

期待: PASS (6 ケース)

- [ ] **Step D6.3: コミット**

```bash
git add src/store/gameStore.ts tests/store/gameStore.test.ts
git commit -m "feat(store): implement Zustand store with input queue + side-effects"
```

---

## Phase E: 永続化レイヤースケルトン (P50: 0.5 日 / P80: 1 日)

### Task E1: schema.ts

**Files:**
- Create: `src/persist/schema.ts`

- [ ] **Step E1.1: schema.ts**

```typescript
// src/persist/schema.ts
import type { DBSchema } from 'idb';

export const DB_NAME = 'wizardry-proving-grounds';
export const DB_VERSION = 1;

export interface WizardryDB extends DBSchema {
  saveSlot: {
    key: number;
    value: {
      id: number;
      name: string;
      createdAt: number;
      updatedAt: number;
      gameState: string;
    };
    indexes: { 'by-updatedAt': number };
  };
  character: {
    key: number;
    value: {
      id: number;
      slotId: number;
      name: string;
      // 詳細は M3 で追加。M1 では最低限のカラム定義のみ
      data: string;     // JSON シリアライズしたキャラ全体
    };
    indexes: { 'by-slotId': number };
  };
  settings: {
    key: string;
    value: string;
  };
  meta: {
    key: string;
    value: string | number;
  };
}
```

- [ ] **Step E1.2: コミット**

```bash
git add src/persist/schema.ts
git commit -m "feat(persist): define IndexedDB schema with idb"
```

### Task E2: db.ts のテスト先行実装

**Files:**
- Create: `tests/persist/db.test.ts`

- [ ] **Step E2.1: テスト**

```typescript
// tests/persist/db.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import 'fake-indexeddb/auto';
import { db } from '@/persist/db';

describe('db settings API', () => {
  beforeEach(async () => {
    // fake-indexeddb は test ごとに初期化
    indexedDB.deleteDatabase('wizardry-proving-grounds');
    await db.init();
  });

  it('setSetting then getSetting returns the value', async () => {
    await db.setSetting('lang', 'ja');
    const v = await db.getSetting('lang');
    expect(v).toBe('ja');
  });

  it('getSetting returns null for unset keys', async () => {
    const v = await db.getSetting('nonexistent');
    expect(v).toBeNull();
  });
});
```

- [ ] **Step E2.2: テスト実行 (失敗確認)**

```bash
pnpm test db
```

期待: モジュールが見つからない

### Task E3: db.ts 実装

**Files:**
- Create: `src/persist/db.ts`

- [ ] **Step E3.1: db.ts**

```typescript
// src/persist/db.ts
import { openDB, type IDBPDatabase } from 'idb';
import { DB_NAME, DB_VERSION, type WizardryDB } from './schema';

let _db: IDBPDatabase<WizardryDB> | null = null;

export async function openWizardryDB(): Promise<IDBPDatabase<WizardryDB>> {
  if (_db) return _db;
  _db = await openDB<WizardryDB>(DB_NAME, DB_VERSION, {
    upgrade(d, oldVersion) {
      if (oldVersion < 1) {
        const slots = d.createObjectStore('saveSlot', { keyPath: 'id', autoIncrement: true });
        slots.createIndex('by-updatedAt', 'updatedAt');
        const chars = d.createObjectStore('character', { keyPath: 'id', autoIncrement: true });
        chars.createIndex('by-slotId', 'slotId');
        d.createObjectStore('settings');
        d.createObjectStore('meta');
      }
    },
  });
  return _db;
}

export const db = {
  async init(): Promise<void> {
    await openWizardryDB();
  },

  async getSetting(key: string): Promise<string | null> {
    const idb = await openWizardryDB();
    const v = await idb.get('settings', key);
    return v ?? null;
  },

  async setSetting(key: string, value: string): Promise<void> {
    const idb = await openWizardryDB();
    await idb.put('settings', value, key);
  },

  // listSlots / saveState / loadState / deleteSlot 等は M5 で実装
};
```

- [ ] **Step E3.2: テスト再実行**

```bash
pnpm test db
```

期待: PASS

- [ ] **Step E3.3: コミット**

```bash
git add src/persist/db.ts tests/persist/db.test.ts
git commit -m "feat(persist): implement settings API with idb (init/get/set)"
```

---

## Phase F: i18n 基盤 (P50: 0.5 日 / P80: 1 日)

### Task F1: messages.ts (M1 範囲)

**Files:**
- Create: `src/i18n/messages.ts`

- [ ] **Step F1.1: messages.ts**

```typescript
// src/i18n/messages.ts
export const MESSAGES = {
  en: {
    'title.subtitle': 'Proving Grounds of the Mad Overlord',
    'title.menu.newGame': 'New Game',
    'title.menu.continue': 'Continue',
    'title.menu.settings': 'Settings',
    'settings.title': 'Settings',
    'settings.language': 'Language',
    'settings.language.en': 'English',
    'settings.language.ja': '日本語',
    'settings.back': 'Back to Title',
    'common.press.enter': 'PRESS ENTER',
  },
  ja: {
    'title.subtitle': 'きょうきのまおうの しれん',
    'title.menu.newGame': 'はじめから',
    'title.menu.continue': 'つづきから',
    'title.menu.settings': 'せってい',
    'settings.title': 'せってい',
    'settings.language': 'げんご',
    'settings.language.en': 'English',
    'settings.language.ja': '日本語',
    'settings.back': 'タイトルに もどる',
    'common.press.enter': 'ENTER をおしてください',
  },
} as const;

export type MessageKey = keyof (typeof MESSAGES)['en'];
export type Lang = keyof typeof MESSAGES;
```

- [ ] **Step F1.2: コミット**

```bash
git add src/i18n/messages.ts
git commit -m "feat(i18n): add Title + Settings messages for en/ja"
```

### Task F2: useT のテスト先行実装

**Files:**
- Create: `tests/i18n/useT.test.tsx`

- [ ] **Step F2.1: テスト**

```typescript
// tests/i18n/useT.test.tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { useT } from '@/i18n/useT';
import { gameStore } from '@/store/gameStore';

function Sample() {
  const t = useT();
  return <span>{t('title.menu.newGame')}</span>;
}

describe('useT', () => {
  it('returns English by default', () => {
    gameStore.setState({ lang: 'en' });
    render(<Sample />);
    expect(screen.getByText('New Game')).toBeInTheDocument();
  });

  it('switches to Japanese when lang changes', () => {
    gameStore.setState({ lang: 'ja' });
    render(<Sample />);
    expect(screen.getByText('はじめから')).toBeInTheDocument();
  });
});
```

- [ ] **Step F2.2: テスト失敗確認**

```bash
pnpm test useT
```

### Task F3: useT.ts 実装

**Files:**
- Create: `src/i18n/useT.ts`

- [ ] **Step F3.1: useT.ts**

```typescript
// src/i18n/useT.ts
import { useGameStore } from '@/store/gameStore';
import { MESSAGES, type MessageKey } from './messages';

export function useT(): (key: MessageKey, vars?: Record<string, string | number>) => string {
  const lang = useGameStore((s) => s.lang);
  return (key, vars) => {
    let str: string = MESSAGES[lang][key] ?? MESSAGES.en[key] ?? key;
    if (vars) {
      for (const [k, v] of Object.entries(vars)) {
        str = str.replaceAll(`{${k}}`, String(v));
      }
    }
    return str;
  };
}
```

- [ ] **Step F3.2: テスト**

```bash
pnpm test useT
```

期待: PASS

- [ ] **Step F3.3: コミット**

```bash
git add src/i18n/useT.ts tests/i18n/useT.test.tsx
git commit -m "feat(i18n): implement useT hook with Zustand subscription"
```

### Task F4: i18n 初期言語決定

**Files:**
- Create: `src/i18n/init.ts`

- [ ] **Step F4.1: init.ts**

```typescript
// src/i18n/init.ts
import { db } from '@/persist/db';
import { gameStore } from '@/store/gameStore';
import type { Lang } from '@/engine/state/types';

export async function initLanguage(): Promise<void> {
  await db.init();
  const stored = await db.getSetting('lang');
  if (stored === 'en' || stored === 'ja') {
    gameStore.setState({ lang: stored });
    return;
  }
  // navigator.language から推定
  const browserLang: Lang = (navigator.language ?? '').startsWith('ja') ? 'ja' : 'en';
  gameStore.setState({ lang: browserLang });
  await db.setSetting('lang', browserLang);
}
```

- [ ] **Step F4.2: コミット**

```bash
git add src/i18n/init.ts
git commit -m "feat(i18n): determine initial language from settings or navigator"
```

---

## Phase G: Title 画面 (P50: 1 日 / P80: 2 日)

### Task G1: Logo コンポーネント

**Files:**
- Create: `src/screens/Title/Logo.tsx`
- Create: `src/screens/Title/Logo.css`

- [ ] **Step G1.1: Logo.tsx (ASCII art)**

```tsx
// src/screens/Title/Logo.tsx
import './Logo.css';

const LOGO_ASCII = String.raw`
 _    _ _____ ______  ___  ____________ _____
| |  | |_   _||___  / / _ \ | ___ \ ___ \  __ \
| |  | |  | |     / / / /_\ \| |_/ / |_/ / |  | |
| |/\| |  | |    / /  |  _  ||    /|    /| |  | |
\  /\  / _| |_  / /__ | | | || |\ \| |\ \| |__| |
 \/  \/  \___/  \_____\\_| |_/\_| \_\_| \_|_____/
`.trimEnd();

export function Logo() {
  return <pre className="apple2-logo">{LOGO_ASCII}</pre>;
}
```

- [ ] **Step G1.2: Logo.css**

```css
.apple2-logo {
  margin: 0;
  font-family: 'Print Char 21', monospace;
  font-size: var(--font-size-glyph);
  line-height: var(--font-size-glyph);
  white-space: pre;
  color: var(--color-fg);
  text-align: center;
}
```

- [ ] **Step G1.3: コミット**

```bash
git add src/screens/Title/Logo.tsx src/screens/Title/Logo.css
git commit -m "feat(screens): add ASCII art logo for Title"
```

### Task G2: Title コンポーネントのテスト

**Files:**
- Create: `tests/screens/Title.test.tsx`

- [ ] **Step G2.1: テスト**

```typescript
// tests/screens/Title.test.tsx
import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Title } from '@/screens/Title';
import { gameStore } from '@/store/gameStore';

describe('<Title>', () => {
  beforeEach(() => {
    gameStore.setState({
      state: { phase: 'title', sub: { kind: 'main' } },
      lang: 'en',
    });
  });

  it('renders New Game / Continue / Settings menu', () => {
    render(<Title />);
    expect(screen.getByText('New Game')).toBeInTheDocument();
    expect(screen.getByText('Continue')).toBeInTheDocument();
    expect(screen.getByText('Settings')).toBeInTheDocument();
  });

  it('shows Settings screen when Settings button clicked', () => {
    render(<Title />);
    fireEvent.click(screen.getByText('Settings'));
    expect(screen.getByText('Language')).toBeInTheDocument();
  });

  it('switches language when changed', () => {
    render(<Title />);
    fireEvent.click(screen.getByText('Settings'));
    fireEvent.click(screen.getByText('日本語'));
    fireEvent.click(screen.getByText('タイトルに もどる'));
    expect(screen.getByText('はじめから')).toBeInTheDocument();
  });
});
```

- [ ] **Step G2.2: テスト失敗確認**

```bash
pnpm test Title
```

### Task G3: Title コンポーネント実装

**Files:**
- Create: `src/screens/Title/index.tsx`
- Create: `src/screens/Title/Title.css`

- [ ] **Step G3.1: index.tsx**

```tsx
// src/screens/Title/index.tsx
import { useT } from '@/i18n/useT';
import { useGameStore, gameStore } from '@/store/gameStore';
import { Frame } from '@/ui/components/Frame';
import { Logo } from './Logo';
import './Title.css';
import type { TitleSubState } from '@/engine/state/types';

export function Title() {
  const sub = useGameStore((s) => {
    const st = s.state;
    return st.phase === 'title' ? st.sub : null;
  }) as TitleSubState | null;

  if (!sub) return null;

  switch (sub.kind) {
    case 'main':
      return <TitleMain />;
    case 'settings':
      return <TitleSettings />;
    case 'continueMenu':
      return <TitleContinue />;
    case 'loading':
      return <Frame title="LOADING">…</Frame>;
    case 'loadError':
      return <Frame title="LOAD ERROR">{sub.reason}</Frame>;
  }
}

function TitleMain() {
  const t = useT();
  const dispatch = (e: Parameters<typeof gameStore.getState>[never] extends never ? never : never) =>
    gameStore.getState().dispatch as never;

  return (
    <div className="title-screen">
      <Logo />
      <p className="title-subtitle">{t('title.subtitle')}</p>
      <div className="title-menu">
        <button type="button" onClick={() => gameStore.getState().dispatch({ type: 'startGame' })}>
          {t('title.menu.newGame')}
        </button>
        <button type="button" onClick={() => gameStore.getState().dispatch({ type: 'openContinue' })}>
          {t('title.menu.continue')}
        </button>
        <button type="button" onClick={() => gameStore.getState().dispatch({ type: 'openSettings' })}>
          {t('title.menu.settings')}
        </button>
      </div>
    </div>
  );
}

function TitleSettings() {
  const t = useT();
  const lang = useGameStore((s) => s.lang);
  return (
    <div className="title-screen">
      <Frame title={t('settings.title')}>
        <div className="settings-row">
          <span>{t('settings.language')}: </span>
          <button type="button" disabled={lang === 'en'} onClick={() => gameStore.getState().dispatch({ type: 'changeLanguage', lang: 'en' })}>
            {t('settings.language.en')}
          </button>
          <button type="button" disabled={lang === 'ja'} onClick={() => gameStore.getState().dispatch({ type: 'changeLanguage', lang: 'ja' })}>
            {t('settings.language.ja')}
          </button>
        </div>
        <button type="button" className="settings-back" onClick={() => gameStore.getState().dispatch({ type: 'closeSettings' })}>
          {t('settings.back')}
        </button>
      </Frame>
    </div>
  );
}

function TitleContinue() {
  const t = useT();
  return (
    <div className="title-screen">
      <Frame title="CONTINUE">
        <p>{t('common.press.enter')}</p>
        {/* M5 で実セーブスロット一覧を表示 */}
      </Frame>
    </div>
  );
}
```

- [ ] **Step G3.2: Title.css**

```css
/* src/screens/Title/Title.css */
.title-screen {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  gap: calc(2 * var(--vp));
}

.title-subtitle {
  margin: 0;
  font-size: var(--font-size-glyph);
  color: var(--color-accent);
}

.title-menu {
  display: flex;
  flex-direction: column;
  gap: calc(1 * var(--vp));
  margin-top: calc(4 * var(--vp));
}

.title-menu button {
  background: var(--color-bg);
  color: var(--color-fg);
  border: var(--vp) solid var(--color-fg);
  padding: calc(1 * var(--vp)) calc(4 * var(--vp));
  font-family: inherit;
  font-size: var(--font-size-glyph);
  cursor: pointer;
}

.title-menu button:hover, .title-menu button:focus-visible {
  background: var(--color-fg);
  color: var(--color-bg);
}

.settings-row {
  display: flex;
  align-items: center;
  gap: calc(1 * var(--vp));
  margin-bottom: calc(2 * var(--vp));
}

.settings-row button[disabled] {
  background: var(--color-fg);
  color: var(--color-bg);
}

.settings-back {
  display: block;
  width: 100%;
  margin-top: calc(2 * var(--vp));
}
```

- [ ] **Step G3.3: テスト**

```bash
pnpm test Title
```

期待: PASS (3 ケース)

- [ ] **Step G3.4: コミット**

```bash
git add src/screens/Title/index.tsx src/screens/Title/Title.css tests/screens/Title.test.tsx
git commit -m "feat(screens): implement Title with main/settings/continue states"
```

### Task G4: App.tsx と main.tsx の組み立て

**Files:**
- Create: `src/App.tsx`
- Create: `src/main.tsx`

- [ ] **Step G4.1: App.tsx**

```tsx
// src/App.tsx
import { useGameStore } from '@/store/gameStore';
import { Title } from '@/screens/Title';

export function App() {
  const phase = useGameStore((s) => s.state.phase);
  switch (phase) {
    case 'title':
      return <Title />;
    default:
      return <div>Unknown phase: {phase}</div>;
  }
}
```

- [ ] **Step G4.2: main.tsx**

```tsx
// src/main.tsx
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';
import { initLanguage } from '@/i18n/init';
import { subscribeScaleToWindow, waitForPixelFontsReady } from '@/ui/scale';
import './ui/global.css';

async function bootstrap(): Promise<void> {
  // フォントロード待ち (FOUT 回避) と i18n 初期化を並行実行
  await Promise.all([waitForPixelFontsReady(), initLanguage()]);
  subscribeScaleToWindow();

  const root = document.getElementById('root');
  if (!root) throw new Error('#root not found');
  createRoot(root).render(
    <StrictMode>
      <App />
    </StrictMode>,
  );
}

void bootstrap();
```

- [ ] **Step G4.3: 開発サーバ起動して確認**

```bash
pnpm dev
```

ブラウザで `http://localhost:5173` を開き、以下を目視確認:

- [ ] Wizardry ロゴが Apple II 風フォントで表示される
- [ ] Subtitle が緑色で表示される
- [ ] New Game / Continue / Settings ボタンが表示される
- [ ] Settings → Language → 日本語 を押すと UI が日本語に切り替わる
- [ ] Settings → Back to Title で戻れる
- [ ] ウィンドウサイズを変えると整数倍スケールが適用される

- [ ] **Step G4.4: コミット**

```bash
git add src/App.tsx src/main.tsx
git commit -m "feat: bootstrap App with font loading and language init"
```

---

## Phase H: CI/CD + Vercel デプロイ (P50: 0.5 日 / P80: 1 日)

### Task H1: GitHub Actions CI

**Files:**
- Create: `.github/workflows/ci.yml`

- [ ] **Step H1.1: ci.yml**

```yaml
name: CI

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
        with:
          version: 9
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: pnpm
      - run: pnpm install --frozen-lockfile
      - run: pnpm lint
      - run: pnpm typecheck
      - run: pnpm test
      - run: pnpm build
```

- [ ] **Step H1.2: ローカルで CI コマンドを実行 (動作確認)**

```bash
pnpm lint && pnpm typecheck && pnpm test && pnpm build
```

期待: 全てエラーなし。`dist/` が生成される。

- [ ] **Step H1.3: コミット**

```bash
git add .github/workflows/ci.yml
git commit -m "ci: add GitHub Actions for lint/typecheck/test/build"
```

### Task H2: Vercel 設定

**Files:**
- Create: `vercel.json`

- [ ] **Step H2.1: vercel.json**

```json
{
  "$schema": "https://openapi.vercel.sh/vercel.json",
  "buildCommand": "pnpm build",
  "outputDirectory": "dist",
  "framework": null,
  "installCommand": "pnpm install --frozen-lockfile",
  "headers": [
    {
      "source": "/fonts/(.*)",
      "headers": [{ "key": "Cache-Control", "value": "public, max-age=31536000, immutable" }]
    }
  ]
}
```

- [ ] **Step H2.2: コミット**

```bash
git add vercel.json
git commit -m "chore: configure Vercel static deployment"
```

### Task H3: README + CHANGELOG

**Files:**
- Create: `README.md`
- Create: `CHANGELOG.md`

- [ ] **Step H3.1: README.md**

```markdown
# Wizardry Proving Grounds

Apple II 版 Wizardry #1 "Proving Grounds of the Mad Overlord" (1981) のブラウザ再現プロジェクト。

## 開発状況
- ✅ Chapter 1 / M0 + M1: プロジェクト基盤、Title 画面、i18n、初回 Vercel デプロイ
- ⏳ M2 以降: Castle / Edge of Town メニュー、キャラ作成、迷宮、セーブ機能

詳細は [docs/superpowers/specs/](docs/superpowers/specs/) と [docs/superpowers/plans/](docs/superpowers/plans/) を参照。

## 開発

```bash
pnpm install
pnpm dev          # 開発サーバ
pnpm test         # テスト実行
pnpm build        # 本番ビルド
pnpm lint         # Biome lint
pnpm typecheck    # tsc --noEmit
```

## デプロイ

main ブランチへの push で Vercel が自動デプロイ。

## ライセンス

- 本プロジェクトのソースコード: MIT
- Wizardry の商標・著作権: Sir-Tech / 現在の権利者に帰属
- 本プロジェクトは非営利・教育目的のファン実装

## 謝辞

- snafaru/Wizardry.Code (Pascal ソースの保存)
- tk421.net (Wizardry I 攻略情報)
- Andrew Greenberg, Robert Woodhead (オリジナル開発者)
```

- [ ] **Step H3.2: CHANGELOG.md**

```markdown
# Changelog

## [Chapter 1 / M0 + M1] - 2026-XX-XX

### Added
- Pascal extraction infrastructure (`docs/reference/wiz1/`)
- Vite + React 18 + TypeScript strict project skeleton
- Apple II virtual pixel grid (`--vp` CSS variable, integer scaling)
- Print Char 21 (English) and Misaki Gothic (Japanese) fonts
- State machine foundation: Zustand store with input queue + side-effect orchestration
- IndexedDB persistence layer (settings only at this milestone)
- i18n: English/Japanese with hot reload
- Title screen with main/settings/continue sub-states
- GitHub Actions CI (lint/typecheck/test/build)
- Vercel deployment configuration

### Notes
- M2 以降の機能 (Castle / Edge of Town メニュー、キャラ作成、迷宮、セーブ機能) は次のマイルストーンで実装
```

- [ ] **Step H3.3: コミット**

```bash
git add README.md CHANGELOG.md
git commit -m "docs: add README and CHANGELOG for M0+M1 milestone"
```

### Task H4: Vercel 本番デプロイ

> **手作業フェーズ**: Vercel CLI または Web UI から初回プロジェクトを作成し、本リポジトリと連携する。

- [ ] **Step H4.1: Vercel に project を作成**

```bash
# Vercel CLI でログイン (初回のみ)
vercel login

# プロジェクトリンク (対話式)
vercel link
```

選択: New project → name: `wizardry-proving-grounds`

- [ ] **Step H4.2: 本番デプロイ**

```bash
vercel --prod
```

期待: `https://wizardry-proving-grounds.vercel.app` が払い出される。

- [ ] **Step H4.3: 本番環境で動作確認**

ブラウザで本番 URL を開き、以下を確認:

- [ ] Title 画面が表示される
- [ ] フォントが Apple II 風になっている (FOUT なし)
- [ ] Settings で言語切替できる
- [ ] ウィンドウリサイズで整数倍スケールが維持される
- [ ] Lighthouse スコア 90+ (目標 95+)

- [ ] **Step H4.4: 本番 URL を README に記載**

```bash
# README.md に "本番デモ: https://..." を追加
git add README.md
git commit -m "docs: add production URL to README"
```

### Task H5: GitHub リモートに push

- [ ] **Step H5.1: GitHub リポジトリ作成**

```bash
gh repo create katsuo-ship-it/wizardry_proving_grounds --public --source=. --push
```

期待: `https://github.com/katsuo-ship-it/wizardry_proving_grounds` が作成される。

- [ ] **Step H5.2: 本番デモを README に反映してコミット**

```bash
# 既に Step H4.4 でコミット済みなら push のみ
git push origin main
```

- [ ] **Step H5.3: GitHub Actions が成功することを確認**

```bash
gh run watch
```

期待: lint / typecheck / test / build すべて成功。

---

## 完了基準 (Definition of Done for M0+M1)

- [ ] M0: Pascal データ抽出が完了し `docs/reference/wiz1/` に整理されている (またはフォールバックで二次ソース起点のデータが整備されている)
- [ ] M1: 上記 Phase B〜H が全て完了
- [ ] CI: GitHub Actions の lint/typecheck/test/build が main で成功
- [ ] 本番: Vercel に Title 画面がデプロイされ、言語切替・スケール維持が動作
- [ ] テスト: `pnpm test` が PASS、カバレッジ未測定でも問題なし (M3 以降で計測導入)
- [ ] コミット: 各 Phase ごとに最低 1 回のコミット (TDD 単位の細かいコミットを推奨)

完了したら次の Plan: `2026-XX-XX-chapter1-m2-castle-edgeoftown.md` (M2 のメニュー画面構築) を新規作成して進める。
