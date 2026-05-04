# Pascal 抽出ログ

抽出作業の進行・問題・解決策を時系列で記録する。

## 2026-05-04 (Phase A 着手・Pascal 抽出未実施)

### 状況

- snafaru/Wizardry.Code はクローン未実施
- CiderPress II は未インストール
- DSK 抽出は **未実施** → 各データ表は **二次ソース由来 (🟡)** で初期化

### 暫定方針

データ表 (`data-tables/*.md`) を以下の優先順で埋める:

1. **tk421**: 迷宮 L1 / 呪文・モンスター・アイテム
2. **Wizardry Wiki**: 種族・職業の能力値・条件
3. **1981 マニュアル**: メニュー仕様

→ 全エントリに 🟡 マークを付与し、Pascal 抽出後の検証で 🟢 に昇格させる

### TODO

- [ ] CiderPress II CLI をインストール (現環境: Windows 11)
- [ ] snafaru/Wizardry.Code をローカルクローン
- [ ] Wiz1A〜Wiz1E.DSK から .TEXT 抽出
- [ ] 各データ表を Pascal 由来の値で更新
- [ ] open-questions.md の Q-001〜Q-006 を解消

## 抽出完了後の検証手順

1. 各 `data-tables/*.md` で 🟡 マークを 🟢 に書き換え
2. Pascal 由来の値が二次ソースと一致するなら "Verified against Pascal" コメントを追記
3. 不一致があれば原因を `extraction-log.md` に記録、`open-questions.md` で議論
4. 最終的に Plan の Phase A タスクを完了マーク

## 参考: CiderPress II の起動例 (Windows)

```powershell
# Wiz1A.DSK の中身を一覧表示
cipher.exe list path\to\Wiz1A.DSK

# Pascal Volume 認識用フラグが必要な場合
cipher.exe list --raw path\to\Wiz1A.DSK

# 全 .TEXT を一括抽出 (本リポジトリのヘルパー)
.\scripts\extract-dsk.ps1 -DskPath path\to\Wiz1A.DSK -OutDir docs\reference\wiz1\pascal-sources\Wiz1A
```
