# Chapter 1 - Open Questions

未確定項目を一元管理する。実装時に判断が必要になったら参照する。Pascal 抽出が完了したら順次解消する。

## 抽出関連

- [ ] **Q-001**: WIZARDRY.CODE のコードセグメントが抽出できなかった場合、職業条件・呪文効果は二次ソースで埋める。優先順位: (1) Pascal 一致疑い箇所のスポット解読 (2) Wizardry Wiki (3) 1981 マニュアル

## キャラクター作成

- [ ] **Q-002**: ボーナスポイントの正確な分布式 (Pascal `BONUS` プロシージャを要再確認)。`character-creation.md` の暫定仕様 (5..10 + 1/10 で +10 連鎖) は修正される可能性大
- [ ] **Q-003**: 能力値上限が **18** で正しいか / 種族別の上限差異がないか (Pascal で確認)
- [ ] **Q-004**: HP 初期値計算式 (Chapter 2 で本格的に必要だが、M3 のキャラ作成完了時点でも初期 HP を保持する必要あり)

## 迷宮

- [x] **Q-005**: Edge 正規化の自動チェックスクリプトが必要か → 不要、テストで担保 (2026-05-04)
- [x] **Q-006**: L1 の暗闇マス座標 → 38 セル、Sorcery データから取り込み確定 (2026-05-04)
- [ ] **Q-011**: L1 のメッセージ文言 (英語 / 日本語ローカライズ用) — 保留 (Pascal 抽出時に再検討)
- [x] **Q-012**: 開始位置の正確な座標 → (0, 19) TS 座標 = 画像 (0, 0)、北向き、stairsUp で確定 (2026-05-04)
- [x] **Q-014**: 迷宮 3D ワイヤーフレーム描画アルゴリズムの再設計 → 解決済 (2026-05-10)

## 職業

- [ ] **Q-007**: 職業変更時の能力値・経験値・装備の挙動 (Chapter 2)

## アイテム

- [ ] **Q-008**: Boltac の初期在庫数 / 補充タイミング (1981 オリジナルの挙動)
- [ ] **Q-009**: 売却価格の計算式 (購入価格の何割か)
- [ ] **Q-010**: Chapter 1 で実装すべき装備の最終確定

## 呪文 (Chapter 3 以降)

- [ ] **Q-013**: Bishop の呪文初期 MP の計算

## 戦闘 (Chapter 2)

- (Chapter 2 開始時に追加)

## 解決済

(解決した Q を移動して履歴を残す)

### ✅ Q-014 (解決日: 2026-05-10)
- 解決方法: per-cell rect 方式を全廃し、Three.js + Shaded Walls による
  3D 描画に移行
- 反映:
  - spec `docs/superpowers/specs/2026-05-09-maze-3d-render-redesign-design.md`
  - plan `docs/superpowers/plans/2026-05-09-maze-3d-render-redesign.md`
  - 実装 PR: feature/maze-3d-render ブランチ全体
- Notes:
  - `wip/maze-render-polish-attempt` ブランチは参考用に残置
  - 当初候補だった range-scan 方式は brainstorming 中にユーザーが Three.js
    路線を再選択して却下

## 解決方法のメモ

各 Q を解決する際は以下を記録する:

- 解決日
- 解決方法 (どのファイル・どの行を確認したか)
- 反映先 (どの `data-tables/*.md` または `algorithms/*.md` を更新したか)

例:

```markdown
## 解決済

### ✅ Q-002 (解決日: 2026-XX-XX)
- 解決方法: `pascal-sources/Wiz1A/MAKECHAR.TEXT` lines 45-67 を確認
- 結果: `bonus = 5 + d10` の単純式、連鎖は 1/13 で +10
- 反映: `algorithms/character-creation.md` の暫定仕様を実値で更新、🟡 → 🟢
```
