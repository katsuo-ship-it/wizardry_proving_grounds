import { useEffect, useRef, useState } from "react";
import "./Menu.css";

export interface MenuItem {
  hotkey: string; // 1 文字
  label: string;
  onSelect: () => void;
  disabled?: boolean;
}

interface MenuProps {
  items: MenuItem[];
}

/**
 * 縦並びメニュー (キー入力で選択可能)。
 *
 * 入力方法:
 * - マウスクリック
 * - ホットキー (item.hotkey に対応するキー) で直接選択
 * - 矢印キー ↑/↓ でカーソル移動 + Enter/Space で選択 (独自 QoL)
 *
 * 注: window へグローバルに keydown を bind するため、画面上で同時に
 * 複数の Menu インスタンスをマウントするとホットキーが重複発火する。
 * 一度に 1 つの Menu のみ表示する想定。
 *
 * Frame は付与しない。タイトル付きで枠を出したい場合は呼び出し側で
 * <Frame title="..."><Menu items={...} /></Frame> のようにラップする。
 */
export function Menu({ items }: MenuProps) {
  // 最初の有効な項目をカーソル初期位置に
  const initialCursor = items.findIndex((i) => !i.disabled);
  const [cursor, setCursor] = useState(initialCursor < 0 ? 0 : initialCursor);
  const itemsRef = useRef(items);
  itemsRef.current = items;

  // items が入れ替わったらカーソルを最初の有効項目に戻す
  // biome-ignore lint/correctness/useExhaustiveDependencies: items は ref で参照、length と再生成の判定で十分
  useEffect(() => {
    const i = items.findIndex((x) => !x.disabled);
    setCursor(i < 0 ? 0 : i);
  }, [items.length]);

  useEffect(() => {
    function findNextEnabled(from: number, dir: 1 | -1): number {
      const list = itemsRef.current;
      const n = list.length;
      if (n === 0) return 0;
      let i = from;
      for (let step = 0; step < n; step++) {
        i = (i + dir + n) % n;
        if (!list[i]?.disabled) return i;
      }
      return from;
    }

    function handler(e: KeyboardEvent): void {
      const list = itemsRef.current;
      const lower = e.key.toLowerCase();

      // ホットキー直接選択
      const hotkeyMatch = list.find((i) => i.hotkey.toLowerCase() === lower && !i.disabled);
      if (hotkeyMatch) {
        e.preventDefault();
        hotkeyMatch.onSelect();
        return;
      }

      // 矢印キー: カーソル移動
      if (e.key === "ArrowDown" || e.key === "ArrowRight") {
        e.preventDefault();
        setCursor((c) => findNextEnabled(c, 1));
        return;
      }
      if (e.key === "ArrowUp" || e.key === "ArrowLeft") {
        e.preventDefault();
        setCursor((c) => findNextEnabled(c, -1));
        return;
      }

      // Enter / Space: 現在のカーソル位置を選択
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        const current = list[cursor];
        if (current && !current.disabled) {
          current.onSelect();
        }
      }
    }

    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [cursor]);

  return (
    <ul className="menu-list">
      {items.map((item, idx) => (
        <li key={item.hotkey}>
          <button
            type="button"
            className={`menu-item${idx === cursor ? " menu-item--cursor" : ""}`}
            onClick={item.onSelect}
            onMouseEnter={() => !item.disabled && setCursor(idx)}
            disabled={item.disabled ?? false}
          >
            <span className="menu-cursor" aria-hidden="true">
              {idx === cursor ? ">" : " "}
            </span>
            <span className="menu-hotkey">[{item.hotkey}]</span>
            <span className="menu-label">{item.label}</span>
          </button>
        </li>
      ))}
    </ul>
  );
}
