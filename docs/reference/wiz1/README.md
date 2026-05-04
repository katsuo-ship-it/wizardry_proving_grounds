# Wizardry I (Apple II 1981) 参照資料

本プロジェクトの「仕様書」として参照する一次・二次資料を整理する。

## 抽出元 (一次ソース)

- [snafaru/Wizardry.Code](https://github.com/snafaru/Wizardry.Code)
- 対象: `Wiz1A.DSK`, `Wiz1B.DSK`, `Wiz1C.DSK`, `Wiz1D.DSK`, `Wiz1E.DSK`
- 言語: UCSD Pascal 1.1 + 6502 アセンブラ

## 抽出ツール

- 推奨: [CiderPress II](https://github.com/fadden/ciderpress2/releases) (Windows / Mac / Linux)
  - `cipher.exe` (Windows) または `cipher` の CLI を使用
  - GUI 版もあるが、バッチ処理は CLI が便利
- 代替: [AppleCommander](https://applecommander.github.io/) (Java 製、クロスプラットフォーム)

## 抽出手順

1. snafaru リポジトリをローカルにクローン:
   ```bash
   git clone https://github.com/snafaru/Wizardry.Code.git
   ```
2. CiderPress II CLI をインストール (PATH 通し)
3. 本リポジトリの `scripts/extract-dsk.ps1` を使い、5 枚の DSK から `.TEXT` ファイルを抽出
4. 抽出結果を `pascal-sources/Wiz1A/`〜`pascal-sources/Wiz1E/` に配置
5. 抽出時の手順・困難点を [`extraction-log.md`](./extraction-log.md) に記録
6. 各データ表 (`data-tables/*.md`)、アルゴリズム解説 (`algorithms/*.md`) を Pascal 由来の数値で更新

## 二次ソース (Pascal 抽出失敗時のフォールバック)

優先順位順:

1. **[tk421 Wizardry Maps & Resources](https://www.tk421.net/wizardry/)** — 老舗の攻略サイト、特に迷宮地図と呪文・モンスター情報が詳細
2. **[Wizardry Wiki (wizardry.wiki.gg)](https://wizardry.wiki.gg/)** — シリーズ横断、Wizardry I の数値も豊富
3. **[1981 Apple II マニュアル](https://archive.org/search?query=Wizardry+manual)** — Internet Archive で公開、UI・操作仕様が公式値
4. **[GameFAQs Walkthroughs](https://gamefaqs.gamespot.com/appleii/575896-wizardry-proving-grounds-of-the-mad-overlord)** — プレイ視点の検証情報

## ディレクトリ構成

```
docs/reference/wiz1/
├── README.md                       # 本ファイル
├── extraction-log.md               # 抽出作業の進行ログ
├── pascal-sources/                 # CiderPress 抽出済み .TEXT ファイル
│   ├── Wiz1A/
│   ├── Wiz1B/
│   ├── Wiz1C/
│   ├── Wiz1D/
│   └── Wiz1E/
├── data-tables/                    # 解読済みデータ表 (Markdown)
│   ├── races.md
│   ├── classes.md
│   ├── items.md
│   └── maze-l1.md
└── algorithms/                     # 解読済みアルゴリズム
    └── character-creation.md
```

## 信頼度マーク規約

各データ表の上部に「**信頼度**」を明記する:

- 🟢 **Pascal 確認済**: 一次ソース (Pascal) から直接書き起こし
- 🟡 **二次ソース**: tk421 / Wizardry Wiki / マニュアル由来、Pascal 抽出後に検証予定
- 🔴 **要検証**: 不明・推測を含む、別ソースで再確認が必要

Plan 段階で 🟡 が多いが、抽出フェーズ完了後に 🟢 へ昇格させていく。

## ライセンス・著作権

- 抽出した Pascal ソースの著作権は元著作者 (Andrew Greenberg / Robert Woodhead / Sir-Tech) に帰属
- 本プロジェクトはこれらを「**仕様書として参照のみ**」する。コードを直接コピーしない（クリーンルーム実装）
- 数値・テーブルなどファクトデータは著作権保護対象外として参照可能
