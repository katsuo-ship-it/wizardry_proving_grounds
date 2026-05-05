import { useEffect } from "react";
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
 * 注: window へグローバルに keydown を bind するため、画面上で同時に
 * 複数の Menu インスタンスをマウントするとホットキーが重複発火する。
 * 一度に 1 つの Menu のみ表示する想定 (現在の使い方では問題なし)。
 *
 * Frame は付与しない。タイトル付きで枠を出したい場合は呼び出し側で
 * <Frame title="..."><Menu items={...} /></Frame> のようにラップする。
 */
export function Menu({ items }: MenuProps) {
  useEffect(() => {
    function handler(e: KeyboardEvent): void {
      const lower = e.key.toLowerCase();
      const match = items.find((i) => i.hotkey.toLowerCase() === lower && !i.disabled);
      if (match) {
        e.preventDefault();
        match.onSelect();
      }
    }
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [items]);

  return (
    <ul className="menu-list">
      {items.map((item) => (
        <li key={item.hotkey}>
          <button
            type="button"
            className="menu-item"
            onClick={item.onSelect}
            disabled={item.disabled ?? false}
          >
            <span className="menu-hotkey">[{item.hotkey}]</span>
            <span className="menu-label">{item.label}</span>
          </button>
        </li>
      ))}
    </ul>
  );
}
