# Wizardry Proving Grounds

Apple II 版 Wizardry #1 "Proving Grounds of the Mad Overlord" (1981) のブラウザ再現プロジェクト。

## 開発状況

- ✅ **Chapter 1 / M0 + M1**: プロジェクト基盤、Title 画面、i18n、状態管理（入力キュー + 副作用 Orchestration）、IndexedDB スケルトン
- ⏳ **Chapter 1 / M2 以降**: Castle / Edge of Town メニュー、キャラ作成、Boltac 売買、迷宮、寺院セーブ
- ⏳ **Chapter 2+**: 戦闘、呪文、レベルアップ、B2F〜B10F、ボス、エンディング

詳細は [docs/superpowers/specs/](docs/superpowers/specs/) と [docs/superpowers/plans/](docs/superpowers/plans/) を参照。

## 必要環境

- Node.js 20+
- pnpm 10+

## セットアップ

```bash
# 依存関係インストール
pnpm install
```

Apple II 風フォント (`PrintChar21.ttf` / `MisakiGothic.ttf`) は `public/fonts/` に同梱済みです。詳細・ライセンスは `public/fonts/README.md` を参照。

## 開発

```bash
pnpm dev          # 開発サーバ (http://localhost:5173)
pnpm test         # テスト実行
pnpm test:watch   # テスト ウォッチモード
pnpm lint         # Biome lint
pnpm format       # Biome auto-format
pnpm typecheck    # tsc --noEmit
pnpm build        # 本番ビルド (dist/)
pnpm preview      # 本番ビルドのプレビュー
```

## デプロイ

main ブランチへの push で Vercel が自動デプロイ。

## 設計思想

- **1981 年オリジナル準拠**: v3.2 以降の改善は加えず、原典の挙動を再現
- **唯一の独自機能**: Temple of Cant でのセーブ機能（神官の年代記）
- **クリーンルーム実装**: snafaru/Wizardry.Code の Pascal ソースを「仕様書」として参照のみ。コードを直接コピーしない

## 著作権・ライセンス

- **本実装のソースコード**: MIT License
- **Wizardry の商標・著作権**: Sir-Tech Software / 現在の権利者に帰属
- **本プロジェクト**: 非営利・教育目的のファン実装

## 謝辞

- Andrew Greenberg, Robert Woodhead — オリジナル開発者
- [snafaru/Wizardry.Code](https://github.com/snafaru/Wizardry.Code) — Pascal ソースの保存・再エンジニアリング
- Thomas William Ewers — Pascal ソースの再構築 (前掲)
- [tk421.net/wizardry](https://www.tk421.net/wizardry/) — Wizardry I 攻略情報の老舗
- 門田暁人 — 美咲フォント (8x8 ピクセル日本語フォント)
- [OnlineWebFonts.com](https://www.onlinewebfonts.com) — Print Char 21 (Apple II 風英語フォント、CC BY 4.0)
