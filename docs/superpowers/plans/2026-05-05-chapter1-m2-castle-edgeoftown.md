# Wizardry Proving Grounds - Chapter 1 / M2 Castle & Edge of Town Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Title 画面の「はじめから」を機能させ、Edge of Town メニュー (T/M/C/U/L) と Castle ハブ (G/B/T/A/E) を実装。Training/Tavern/Boltac/Temple/Inn/Utilities/Maze の 7 サブ画面はプレースホルダ (機能なし、戻るボタンのみ) として配置。Leave Game 確認ダイアログを追加。

**Architecture:** M1 で確立した state machine (reduce + Zustand + 副作用 Orchestration) を踏襲。新しい phase/sub-state を types.ts に追加、各 phase の reduce*.ts を書き、対応する screens/ コンポーネントを作る。共通の縦並びメニュー UI は再利用可能な `Menu` コンポーネントに切り出す。プレースホルダ画面は最小限 (見出し + 戻るボタン) で M3/M4 への目印。

**Tech Stack:** 既存スタック (Vite + React 18 + TypeScript strict + Zustand + Vitest + Biome) を変更なし。新規依存追加なし。

**Reference:** [設計書](../specs/2026-05-04-wizardry-proving-grounds-design.md) Section 1 (画面トポロジ) / Section 4 (ステートマシン) / Section 9 (アニメーション)

---

## File Structure

### Phase A: 共通基盤 (Menu component + types 拡張)
- Create: `src/ui/components/Menu.tsx` — 再利用可能な縦並びメニュー (Frame は呼び出し側で付ける)
- Create: `src/ui/components/Menu.css`
- Test: `tests/ui/components/Menu.test.tsx`
- Modify: `src/engine/state/types.ts` — phases, sub-states, events 追加

### Phase B: Edge of Town
- Create: `src/engine/state/reduceEdgeOfTown.ts`
- Create: `src/screens/EdgeOfTown/index.tsx`
- Test: `tests/engine/state/reduceEdgeOfTown.test.ts`
- Modify: `src/engine/state/reduce.ts` — edgeOfTown ディスパッチ
- Modify: `src/engine/state/reduceTitle.ts` — startGame で edgeOfTown へ
- Modify: `src/App.tsx` — edgeOfTown レンダリング

### Phase C: Castle
- Create: `src/engine/state/reduceCastle.ts`
- Create: `src/screens/Castle/index.tsx`
- Test: `tests/engine/state/reduceCastle.test.ts`
- Modify: `src/engine/state/reduce.ts` — castle ディスパッチ
- Modify: `src/App.tsx` — castle レンダリング

### Phase D: 7 サブ画面プレースホルダ
- Create: `src/screens/Training/index.tsx` (Edge of Town 配下)
- Create: `src/screens/Utilities/index.tsx` (Edge of Town 配下)
- Create: `src/screens/Tavern/index.tsx` (Castle 配下)
- Create: `src/screens/Boltac/index.tsx` (Castle 配下)
- Create: `src/screens/Temple/index.tsx` (Castle 配下)
- Create: `src/screens/Inn/index.tsx` (Castle 配下)
- Create: `src/screens/Maze/index.tsx` (Edge of Town 配下、M4 placeholder)
- Create: `src/screens/Placeholder.tsx` — 共通 placeholder UI
- Create: `src/screens/Placeholder.css`
- Create: `src/engine/state/reducePlaceholder.ts` — 全 placeholder phase 共通の back-only reducer
- Modify: `src/engine/state/reduce.ts` — 7 phase 追加
- Modify: `src/App.tsx` — 7 phase レンダリング
- Test: `tests/engine/state/reducePlaceholder.test.ts`
- Test: `tests/screens/Placeholder.test.tsx` (smoke test)

### Phase E: Leave Game 確認ダイアログ
- Modify: `src/engine/state/reduceEdgeOfTown.ts` — confirmLeave sub-state ハンドリング
- Modify: `src/screens/EdgeOfTown/index.tsx` — 確認ダイアログ表示
- Test: `tests/engine/state/reduceEdgeOfTown.test.ts` — 確認フロー追加

### Phase F: 統合 + デプロイ
- Modify: `CHANGELOG.md` — M2 リリースノート
- Modify: `README.md` — M2 完了マーク
- ローカル動作確認 → push → CI → Vercel 自動デプロイ

---

## Phase A: 共通基盤 (P50: 0.5 日)

### Task A1: types.ts 拡張 — 新規 phase/sub-state/event 定義

**Files:**
- Modify: `src/engine/state/types.ts`

- [ ] **Step A1.1: PartyState を追加**

`types.ts` の先頭付近に追加:

```typescript
// パーティ (M3 でキャラ追加が始まるが、M2 で型を先に定義)
export type CharacterId = number;
export type SlotIndex = 0 | 1 | 2 | 3 | 4 | 5;

export interface PartyState {
  members: (CharacterId | null)[];           // 長さ 6
  gold: number;
  status: 'inTown' | 'inMaze' | 'out';
  outAtPosition?: { level: number; x: number; y: number; dir: 'n' | 'e' | 's' | 'w' };
}

export const EMPTY_PARTY: PartyState = {
  members: [null, null, null, null, null, null],
  gold: 0,
  status: 'inTown',
};
```

- [ ] **Step A1.2: Edge of Town / Castle / placeholder phase の sub-state を追加**

```typescript
export type EdgeOfTownSubState = { kind: 'menu' } | { kind: 'confirmLeave' };

// Castle, Training, Utilities, Tavern, Boltac, Temple, Inn, Maze は M2 では
// menu/placeholder のみ。M3 以降で各々拡張される。
export type SimpleSubState = { kind: 'menu' };
```

- [ ] **Step A1.3: GameState union を拡張**

既存の `GameState = { phase: 'title'; sub: TitleSubState }` を以下に置き換え:

```typescript
export type GameState =
  | { phase: 'title'; sub: TitleSubState }
  | { phase: 'edgeOfTown'; sub: EdgeOfTownSubState; party: PartyState }
  | { phase: 'castle'; sub: SimpleSubState; party: PartyState }
  | { phase: 'training'; sub: SimpleSubState; party: PartyState }
  | { phase: 'utilities'; sub: SimpleSubState; party: PartyState }
  | { phase: 'tavern'; sub: SimpleSubState; party: PartyState }
  | { phase: 'boltac'; sub: SimpleSubState; party: PartyState }
  | { phase: 'temple'; sub: SimpleSubState; party: PartyState }
  | { phase: 'inn'; sub: SimpleSubState; party: PartyState }
  | { phase: 'maze'; sub: SimpleSubState; party: PartyState };
```

- [ ] **Step A1.4: GameEvent を拡張**

既存 union に追加:

```typescript
export type GameEvent =
  // ... 既存
  // Title
  | { type: 'startGame' }                              // 既存 (M1 では no-op、M2 で実装)
  // Edge of Town
  | { type: 'goToTraining' }
  | { type: 'goToMaze' }
  | { type: 'goToCastle' }
  | { type: 'goToUtilities' }
  | { type: 'leaveGame' }                              // 確認ダイアログ表示
  | { type: 'confirmLeaveGame' }                       // 確定 → title
  | { type: 'cancelLeaveGame' }                        // 取消 → menu
  // Castle
  | { type: 'enterTavern' }
  | { type: 'enterBoltac' }
  | { type: 'enterTemple' }
  | { type: 'enterInn' }
  | { type: 'leaveCastle' }                            // → Edge of Town
  // Placeholder phases (Training, Utilities, Tavern, Boltac, Temple, Inn, Maze)
  | { type: 'goBack' };                                // 各 placeholder からの汎用「戻る」
  // 既存の loadFailed は M1 から維持
```

> 注: 既存の `loadStarted` / `loadFailed` は維持。`startGame` は型としては M1 から存在したが、M1 では reducer で no-op だった。M2 で実装する。

- [ ] **Step A1.5: typecheck**

```bash
pnpm typecheck
```

期待: 型エラーがいくつか出る (既存 `App.tsx`, `gameStore.test.ts` などが新しい union を網羅してない)。**この段階では OK** (Phase B 以降で順次解消)。

- [ ] **Step A1.6: コミット**

```bash
git add src/engine/state/types.ts
git commit -m "feat(types): extend GameState/GameEvent for M2 phases"
```

### Task A2: 共通 Menu コンポーネント

**Files:**
- Create: `src/ui/components/Menu.tsx`
- Create: `src/ui/components/Menu.css`
- Test: `tests/ui/components/Menu.test.tsx`

- [ ] **Step A2.1: テスト先行**

```typescript
// tests/ui/components/Menu.test.tsx
import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { Menu } from '@/ui/components/Menu';

describe('<Menu>', () => {
  it('renders all items with hotkey labels', () => {
    render(
      <Menu
        items={[
          { hotkey: 'T', label: 'Training Grounds', onSelect: () => {} },
          { hotkey: 'M', label: 'Maze', onSelect: () => {} },
        ]}
      />,
    );
    expect(screen.getByText(/Training Grounds/)).toBeInTheDocument();
    expect(screen.getByText(/Maze/)).toBeInTheDocument();
    expect(screen.getByText('[T]')).toBeInTheDocument();
    expect(screen.getByText('[M]')).toBeInTheDocument();
  });

  it('invokes onSelect when item clicked', () => {
    const handleA = vi.fn();
    render(
      <Menu
        items={[
          { hotkey: 'A', label: 'Alpha', onSelect: handleA },
          { hotkey: 'B', label: 'Beta', onSelect: () => {} },
        ]}
      />,
    );
    fireEvent.click(screen.getByText(/Alpha/));
    expect(handleA).toHaveBeenCalledTimes(1);
  });

  it('invokes onSelect on hotkey press', () => {
    const handleA = vi.fn();
    render(
      <Menu
        items={[{ hotkey: 'A', label: 'Alpha', onSelect: handleA }]}
      />,
    );
    fireEvent.keyDown(window, { key: 'a' });
    expect(handleA).toHaveBeenCalledTimes(1);
  });
});
```

- [ ] **Step A2.2: テスト失敗確認**

```bash
pnpm test Menu
```

期待: `Cannot find module '@/ui/components/Menu'`

- [ ] **Step A2.3: 実装**

```typescript
// src/ui/components/Menu.tsx
import { useEffect } from 'react';
import './Menu.css';

export interface MenuItem {
  hotkey: string;                  // 1 文字
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
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
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
```

- [ ] **Step A2.4: CSS**

```css
/* src/ui/components/Menu.css */
/* .menu-screen は呼び出し側でラップする際に使う共通レイアウト用 */
.menu-screen {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
}

.menu-list {
  list-style: none;
  margin: 0;
  padding: 0;
}

.menu-item {
  display: flex;
  align-items: center;
  gap: calc(2 * var(--vp));
  width: 100%;
  background: var(--color-bg);
  color: var(--color-fg);
  border: var(--vp) solid transparent;
  padding: calc(1 * var(--vp)) calc(2 * var(--vp));
  font-family: inherit;
  font-size: var(--font-size-glyph);
  cursor: pointer;
  text-align: left;
}

.menu-item:hover,
.menu-item:focus-visible {
  border-color: var(--color-fg);
}

.menu-item[disabled] {
  color: #666;
  cursor: default;
}

.menu-hotkey {
  color: var(--color-accent);
}

.menu-label {
  flex: 1;
}
```

- [ ] **Step A2.5: テスト**

```bash
pnpm test Menu
```

期待: 3/3 PASS

- [ ] **Step A2.6: コミット**

```bash
git add src/ui/components/Menu.tsx src/ui/components/Menu.css tests/ui/components/Menu.test.tsx
git commit -m "feat(ui): add reusable Menu component with hotkey support"
```

---

## Phase B: Edge of Town (P50: 0.5 日)

### Task B1: reduceEdgeOfTown のテスト先行実装

**Files:**
- Create: `tests/engine/state/reduceEdgeOfTown.test.ts`

- [ ] **Step B1.1: テスト**

```typescript
// tests/engine/state/reduceEdgeOfTown.test.ts
import { describe, expect, it } from 'vitest';
import { reduce } from '@/engine/state/reduce';
import { EMPTY_PARTY, type GameState } from '@/engine/state/types';

const initial: GameState = {
  phase: 'edgeOfTown',
  sub: { kind: 'menu' },
  party: EMPTY_PARTY,
};

describe('edgeOfTown phase reducer', () => {
  it('goToTraining → training phase', () => {
    expect(reduce(initial, { type: 'goToTraining' })).toEqual({
      phase: 'training',
      sub: { kind: 'menu' },
      party: EMPTY_PARTY,
    });
  });

  it('goToMaze → maze phase', () => {
    expect(reduce(initial, { type: 'goToMaze' })).toEqual({
      phase: 'maze',
      sub: { kind: 'menu' },
      party: EMPTY_PARTY,
    });
  });

  it('goToCastle → castle phase', () => {
    expect(reduce(initial, { type: 'goToCastle' })).toEqual({
      phase: 'castle',
      sub: { kind: 'menu' },
      party: EMPTY_PARTY,
    });
  });

  it('goToUtilities → utilities phase', () => {
    expect(reduce(initial, { type: 'goToUtilities' })).toEqual({
      phase: 'utilities',
      sub: { kind: 'menu' },
      party: EMPTY_PARTY,
    });
  });

  it('leaveGame from menu → confirmLeave sub-state', () => {
    expect(reduce(initial, { type: 'leaveGame' })).toEqual({
      phase: 'edgeOfTown',
      sub: { kind: 'confirmLeave' },
      party: EMPTY_PARTY,
    });
  });

  it('confirmLeaveGame from confirmLeave → title', () => {
    const fromConfirm: GameState = {
      phase: 'edgeOfTown',
      sub: { kind: 'confirmLeave' },
      party: EMPTY_PARTY,
    };
    expect(reduce(fromConfirm, { type: 'confirmLeaveGame' })).toEqual({
      phase: 'title',
      sub: { kind: 'main' },
    });
  });

  it('cancelLeaveGame from confirmLeave → menu', () => {
    const fromConfirm: GameState = {
      phase: 'edgeOfTown',
      sub: { kind: 'confirmLeave' },
      party: EMPTY_PARTY,
    };
    expect(reduce(fromConfirm, { type: 'cancelLeaveGame' })).toEqual(initial);
  });
});
```

- [ ] **Step B1.2: テスト失敗確認**

```bash
pnpm test reduceEdgeOfTown
```

期待: モジュールが見つからない or `edgeOfTown` 遷移が未実装で FAIL

### Task B2: reduceEdgeOfTown.ts 実装

**Files:**
- Create: `src/engine/state/reduceEdgeOfTown.ts`
- Modify: `src/engine/state/reduce.ts`

- [ ] **Step B2.1: reduceEdgeOfTown.ts**

```typescript
// src/engine/state/reduceEdgeOfTown.ts
import type { GameEvent, GameState, PartyState } from './types';

export function reduceEdgeOfTown(
  state: Extract<GameState, { phase: 'edgeOfTown' }>,
  event: GameEvent,
): GameState {
  const { sub, party } = state;

  if (sub.kind === 'menu') {
    switch (event.type) {
      case 'goToTraining':
        return { phase: 'training', sub: { kind: 'menu' }, party };
      case 'goToMaze':
        return { phase: 'maze', sub: { kind: 'menu' }, party };
      case 'goToCastle':
        return { phase: 'castle', sub: { kind: 'menu' }, party };
      case 'goToUtilities':
        return { phase: 'utilities', sub: { kind: 'menu' }, party };
      case 'leaveGame':
        return { ...state, sub: { kind: 'confirmLeave' } };
      default:
        return state;
    }
  }

  if (sub.kind === 'confirmLeave') {
    switch (event.type) {
      case 'confirmLeaveGame':
        return { phase: 'title', sub: { kind: 'main' } };
      case 'cancelLeaveGame':
        return { ...state, sub: { kind: 'menu' } };
      default:
        return state;
    }
  }

  return state;
}
```

- [ ] **Step B2.2: reduce.ts に edgeOfTown ディスパッチ追加**

`src/engine/state/reduce.ts` を以下に書き換え:

```typescript
import { reduceEdgeOfTown } from './reduceEdgeOfTown';
import { reduceTitle } from './reduceTitle';
import type { GameEvent, GameState } from './types';

export function reduce(state: GameState, event: GameEvent): GameState {
  switch (state.phase) {
    case 'title':
      return reduceTitle(state, event);
    case 'edgeOfTown':
      return reduceEdgeOfTown(state, event);
    default:
      return state;
  }
}
```

- [ ] **Step B2.3: テスト**

```bash
pnpm test reduceEdgeOfTown
```

期待: 7/7 PASS

- [ ] **Step B2.4: コミット**

```bash
git add src/engine/state/reduceEdgeOfTown.ts src/engine/state/reduce.ts tests/engine/state/reduceEdgeOfTown.test.ts
git commit -m "feat(engine): implement Edge of Town reducer with leave-confirm flow"
```

### Task B3: Title.startGame で Edge of Town へ遷移

**Files:**
- Modify: `src/engine/state/reduceTitle.ts`
- Modify: `tests/engine/state/reduceTitle.test.ts`

- [ ] **Step B3.1: テスト更新 (M1 の "startGame は no-op" を更新)**

`tests/engine/state/reduceTitle.test.ts` の最後のテストを書き換え:

```typescript
it('startGame from main → edgeOfTown with empty party', () => {
  const next = reduce(initial, { type: 'startGame' });
  expect(next).toEqual({
    phase: 'edgeOfTown',
    sub: { kind: 'menu' },
    party: {
      members: [null, null, null, null, null, null],
      gold: 0,
      status: 'inTown',
    },
  });
});
```

- [ ] **Step B3.2: reduceTitle.ts 更新**

```typescript
// 既存 default ケースの直前に追加
case 'startGame':
  if (sub.kind === 'main') {
    return { phase: 'edgeOfTown', sub: { kind: 'menu' }, party: EMPTY_PARTY };
  }
  return state;
```

import に `EMPTY_PARTY` 追加:

```typescript
import type { GameEvent, GameState } from './types';
import { EMPTY_PARTY } from './types';
```

- [ ] **Step B3.3: テスト**

```bash
pnpm test reduceTitle
```

期待: 5/5 PASS

- [ ] **Step B3.4: コミット**

```bash
git add src/engine/state/reduceTitle.ts tests/engine/state/reduceTitle.test.ts
git commit -m "feat(engine): wire startGame to Edge of Town"
```

### Task B4: EdgeOfTown 画面コンポーネント

**Files:**
- Create: `src/screens/EdgeOfTown/index.tsx`
- Create: `src/screens/EdgeOfTown/EdgeOfTown.css` (オプション、Menu CSS で十分なら作らなくて OK)

- [ ] **Step B4.1: 実装**

```typescript
// src/screens/EdgeOfTown/index.tsx
import { useT } from '@/i18n/useT';
import { gameStore, useGameStore } from '@/store/gameStore';
import { Frame } from '@/ui/components/Frame';
import { Menu } from '@/ui/components/Menu';

const dispatch = (e: Parameters<ReturnType<typeof gameStore.getState>['dispatch']>[0]) =>
  gameStore.getState().dispatch(e);

export function EdgeOfTown() {
  const sub = useGameStore((s) =>
    s.state.phase === 'edgeOfTown' ? s.state.sub : null,
  );
  if (!sub) return null;

  if (sub.kind === 'confirmLeave') {
    return <ConfirmLeave />;
  }

  return <EdgeOfTownMenu />;
}

function EdgeOfTownMenu() {
  const t = useT();
  return (
    <div className="menu-screen">
      <Frame title={t('edgeOfTown.title')}>
        <Menu
          items={[
            { hotkey: 'T', label: t('edgeOfTown.menu.training'), onSelect: () => dispatch({ type: 'goToTraining' }) },
            { hotkey: 'M', label: t('edgeOfTown.menu.maze'),     onSelect: () => dispatch({ type: 'goToMaze' }) },
            { hotkey: 'C', label: t('edgeOfTown.menu.castle'),   onSelect: () => dispatch({ type: 'goToCastle' }) },
            { hotkey: 'U', label: t('edgeOfTown.menu.utilities'),onSelect: () => dispatch({ type: 'goToUtilities' }) },
            { hotkey: 'L', label: t('edgeOfTown.menu.leaveGame'),onSelect: () => dispatch({ type: 'leaveGame' }) },
          ]}
        />
      </Frame>
    </div>
  );
}

function ConfirmLeave() {
  const t = useT();
  return (
    <div className="menu-screen">
      <Frame title={t('edgeOfTown.confirmLeave.title')}>
        <p>{t('edgeOfTown.confirmLeave.body')}</p>
        <Menu
          items={[
            { hotkey: 'Y', label: t('common.yes'),  onSelect: () => dispatch({ type: 'confirmLeaveGame' }) },
            { hotkey: 'N', label: t('common.no'),   onSelect: () => dispatch({ type: 'cancelLeaveGame' }) },
          ]}
        />
      </Frame>
    </div>
  );
}
```

- [ ] **Step B4.2: i18n メッセージを追加**

`src/i18n/messages.ts` の en/ja に追加:

```typescript
en: {
  // ... 既存
  'edgeOfTown.title': 'Edge of Town',
  'edgeOfTown.menu.training': 'Training Grounds',
  'edgeOfTown.menu.maze': 'Maze',
  'edgeOfTown.menu.castle': 'Castle',
  'edgeOfTown.menu.utilities': 'Utilities',
  'edgeOfTown.menu.leaveGame': 'Leave Game',
  'edgeOfTown.confirmLeave.title': 'LEAVE GAME?',
  'edgeOfTown.confirmLeave.body': 'Unsaved progress will be lost. Save at the Temple before leaving.',
  'common.yes': 'Yes',
  'common.no': 'No',
  'common.back': 'Back',
},
ja: {
  // ... 既存
  'edgeOfTown.title': 'まちのはずれ',
  'edgeOfTown.menu.training': 'くんれんじょう',
  'edgeOfTown.menu.maze': 'めいきゅう',
  'edgeOfTown.menu.castle': 'おしろ',
  'edgeOfTown.menu.utilities': 'ユーティリティ',
  'edgeOfTown.menu.leaveGame': 'ゲームをやめる',
  'edgeOfTown.confirmLeave.title': 'ゲームをやめますか?',
  'edgeOfTown.confirmLeave.body': 'セーブしていない進行は きえてしまいます。じいんで セーブしてから やめましょう。',
  'common.yes': 'はい',
  'common.no': 'いいえ',
  'common.back': 'もどる',
},
```

- [ ] **Step B4.3: App.tsx を edgeOfTown 対応に**

`src/App.tsx`:

```typescript
import { EdgeOfTown } from '@/screens/EdgeOfTown';
import { Title } from '@/screens/Title';
import { useGameStore } from '@/store/gameStore';

export function App() {
  const phase = useGameStore((s) => s.state.phase);
  switch (phase) {
    case 'title':
      return <Title />;
    case 'edgeOfTown':
      return <EdgeOfTown />;
    default:
      return <div>Unknown phase: {phase}</div>;
  }
}
```

- [ ] **Step B4.4: lint + typecheck + test**

```bash
pnpm lint && pnpm typecheck && pnpm test
```

期待: クリーン、全テスト PASS

- [ ] **Step B4.5: 開発サーバで目視確認**

```bash
pnpm dev
```

ブラウザで:
- [ ] タイトルで「はじめから」クリック → Edge of Town メニューに遷移
- [ ] T/M/C/U はクリックすると Phase 遷移するが、まだ画面が "Unknown phase" と出る (Phase D で実装)
- [ ] L キーまたは "ゲームをやめる" → 確認ダイアログ
- [ ] 確認 Y → タイトルに戻る、N → メニューに戻る
- [ ] 言語切替 (Settings からではなく直接 store でテスト) でメッセージが切り替わる

- [ ] **Step B4.6: コミット**

```bash
git add src/screens/EdgeOfTown src/i18n/messages.ts src/App.tsx
git commit -m "feat(screens): add Edge of Town menu + leave-game confirmation"
```

---

## Phase C: Castle (P50: 0.3 日)

### Task C1: reduceCastle のテスト先行実装

**Files:**
- Create: `tests/engine/state/reduceCastle.test.ts`

- [ ] **Step C1.1: テスト**

```typescript
// tests/engine/state/reduceCastle.test.ts
import { describe, expect, it } from 'vitest';
import { reduce } from '@/engine/state/reduce';
import { EMPTY_PARTY, type GameState } from '@/engine/state/types';

const initial: GameState = {
  phase: 'castle',
  sub: { kind: 'menu' },
  party: EMPTY_PARTY,
};

describe('castle phase reducer', () => {
  it.each([
    ['enterTavern', 'tavern'],
    ['enterBoltac', 'boltac'],
    ['enterTemple', 'temple'],
    ['enterInn',    'inn'],
  ] as const)('%s → %s phase', (eventType, expectedPhase) => {
    expect(reduce(initial, { type: eventType })).toEqual({
      phase: expectedPhase,
      sub: { kind: 'menu' },
      party: EMPTY_PARTY,
    });
  });

  it('leaveCastle → edgeOfTown', () => {
    expect(reduce(initial, { type: 'leaveCastle' })).toEqual({
      phase: 'edgeOfTown',
      sub: { kind: 'menu' },
      party: EMPTY_PARTY,
    });
  });
});
```

- [ ] **Step C1.2: テスト失敗確認**

```bash
pnpm test reduceCastle
```

### Task C2: reduceCastle.ts 実装

**Files:**
- Create: `src/engine/state/reduceCastle.ts`
- Modify: `src/engine/state/reduce.ts`

- [ ] **Step C2.1: reduceCastle.ts**

```typescript
// src/engine/state/reduceCastle.ts
import type { GameEvent, GameState } from './types';

export function reduceCastle(
  state: Extract<GameState, { phase: 'castle' }>,
  event: GameEvent,
): GameState {
  const { party } = state;
  switch (event.type) {
    case 'enterTavern':
      return { phase: 'tavern', sub: { kind: 'menu' }, party };
    case 'enterBoltac':
      return { phase: 'boltac', sub: { kind: 'menu' }, party };
    case 'enterTemple':
      return { phase: 'temple', sub: { kind: 'menu' }, party };
    case 'enterInn':
      return { phase: 'inn', sub: { kind: 'menu' }, party };
    case 'leaveCastle':
      return { phase: 'edgeOfTown', sub: { kind: 'menu' }, party };
    default:
      return state;
  }
}
```

- [ ] **Step C2.2: reduce.ts に castle ディスパッチ追加**

```typescript
case 'castle':
  return reduceCastle(state, event);
```

- [ ] **Step C2.3: テスト**

```bash
pnpm test reduceCastle
```

期待: 5/5 PASS

- [ ] **Step C2.4: コミット**

```bash
git add src/engine/state/reduceCastle.ts src/engine/state/reduce.ts tests/engine/state/reduceCastle.test.ts
git commit -m "feat(engine): implement Castle hub reducer (5 sub-locations)"
```

### Task C3: Castle 画面コンポーネント

**Files:**
- Create: `src/screens/Castle/index.tsx`
- Modify: `src/i18n/messages.ts`
- Modify: `src/App.tsx`

- [ ] **Step C3.1: i18n メッセージ追加**

```typescript
// en に追加
'castle.title': 'Castle',
'castle.menu.tavern': "Gilgamesh's Tavern",
'castle.menu.boltac': "Boltac's Trading Post",
'castle.menu.temple': 'Temple of Cant',
'castle.menu.inn': "Adventurer's Inn",
'castle.menu.edgeOfTown': 'Edge of Town',

// ja に追加
'castle.title': 'おしろ',
'castle.menu.tavern': 'ギルガメッシュの さかば',
'castle.menu.boltac': 'ボルタックの しょうてん',
'castle.menu.temple': 'カント じいん',
'castle.menu.inn': 'りゅうの やどや',
'castle.menu.edgeOfTown': 'まちのはずれ',
```

- [ ] **Step C3.2: Castle.tsx**

```typescript
// src/screens/Castle/index.tsx
import { useT } from '@/i18n/useT';
import { gameStore } from '@/store/gameStore';
import { Frame } from '@/ui/components/Frame';
import { Menu } from '@/ui/components/Menu';

const dispatch = (e: Parameters<ReturnType<typeof gameStore.getState>['dispatch']>[0]) =>
  gameStore.getState().dispatch(e);

export function Castle() {
  const t = useT();
  return (
    <div className="menu-screen">
      <Frame title={t('castle.title')}>
        <Menu
          items={[
            { hotkey: 'G', label: t('castle.menu.tavern'),     onSelect: () => dispatch({ type: 'enterTavern' }) },
            { hotkey: 'B', label: t('castle.menu.boltac'),     onSelect: () => dispatch({ type: 'enterBoltac' }) },
            { hotkey: 'T', label: t('castle.menu.temple'),     onSelect: () => dispatch({ type: 'enterTemple' }) },
            { hotkey: 'A', label: t('castle.menu.inn'),        onSelect: () => dispatch({ type: 'enterInn' }) },
            { hotkey: 'E', label: t('castle.menu.edgeOfTown'), onSelect: () => dispatch({ type: 'leaveCastle' }) },
          ]}
        />
      </Frame>
    </div>
  );
}
```

- [ ] **Step C3.3: App.tsx に追加**

```typescript
case 'castle':
  return <Castle />;
```

- [ ] **Step C3.4: 確認**

```bash
pnpm lint && pnpm typecheck && pnpm test
pnpm dev
```

ブラウザで Edge of Town → Castle (C キー) → 5 つのメニューが表示されることを確認 (各サブ画面はまだ "Unknown phase")

- [ ] **Step C3.5: コミット**

```bash
git add src/screens/Castle src/App.tsx src/i18n/messages.ts
git commit -m "feat(screens): add Castle hub menu (5 sub-locations)"
```

---

## Phase D: 7 サブ画面プレースホルダ (P50: 0.5 日)

### Task D1: 共通 Placeholder 画面と reducer

**Files:**
- Create: `src/screens/Placeholder.tsx`
- Create: `src/screens/Placeholder.css`
- Create: `src/engine/state/reducePlaceholder.ts`

- [ ] **Step D1.1: Placeholder.tsx**

```typescript
// src/screens/Placeholder.tsx
import type { ReactNode } from 'react';
import { useT } from '@/i18n/useT';
import { gameStore } from '@/store/gameStore';
import { Frame } from '@/ui/components/Frame';
import { Menu } from '@/ui/components/Menu';
import './Placeholder.css';

interface PlaceholderProps {
  titleKey: import('@/i18n/messages').MessageKey;
  bodyKey: import('@/i18n/messages').MessageKey;
  /** 戻り先 phase 名 (UI 上の説明用)、reducer の遷移は goBack イベントで決まる */
  backLabelKey: import('@/i18n/messages').MessageKey;
  children?: ReactNode;
}

export function Placeholder({ titleKey, bodyKey, backLabelKey }: PlaceholderProps) {
  const t = useT();
  return (
    <div className="menu-screen">
      <Frame title={t(titleKey)}>
        <p className="placeholder-body">{t(bodyKey)}</p>
        <Menu
          items={[
            {
              hotkey: 'B',
              label: t(backLabelKey),
              onSelect: () => gameStore.getState().dispatch({ type: 'goBack' }),
            },
          ]}
        />
      </Frame>
    </div>
  );
}
```

- [ ] **Step D1.2: Placeholder.css**

```css
.placeholder-body {
  color: var(--color-warn);
  font-size: var(--font-size-glyph);
  margin: calc(2 * var(--vp)) 0;
  text-align: center;
}
```

- [ ] **Step D1.3: reducePlaceholder.ts**

```typescript
// src/engine/state/reducePlaceholder.ts
import type { GameEvent, GameState } from './types';

type PlaceholderPhase = 'training' | 'utilities' | 'maze' | 'tavern' | 'boltac' | 'temple' | 'inn';

/**
 * 各 placeholder phase で 'goBack' を受け取ったときの戻り先。
 *
 * - training/utilities/maze は Edge of Town 配下 → edgeOfTown へ
 * - tavern/boltac/temple/inn は Castle 配下 → castle へ
 */
const BACK_TARGET: Record<PlaceholderPhase, 'edgeOfTown' | 'castle'> = {
  training: 'edgeOfTown',
  utilities: 'edgeOfTown',
  maze: 'edgeOfTown',
  tavern: 'castle',
  boltac: 'castle',
  temple: 'castle',
  inn: 'castle',
};

export function reducePlaceholder(
  state: Extract<GameState, { phase: PlaceholderPhase }>,
  event: GameEvent,
): GameState {
  if (event.type === 'goBack') {
    const target = BACK_TARGET[state.phase];
    return { phase: target, sub: { kind: 'menu' }, party: state.party };
  }
  return state;
}
```

- [ ] **Step D1.4: reduce.ts ディスパッチ更新**

```typescript
import { reducePlaceholder } from './reducePlaceholder';

// switch 文に追加
case 'training':
case 'utilities':
case 'maze':
case 'tavern':
case 'boltac':
case 'temple':
case 'inn':
  return reducePlaceholder(state, event);
```

### Task D2: reducePlaceholder のテスト

**Files:**
- Create: `tests/engine/state/reducePlaceholder.test.ts`

- [ ] **Step D2.1: テスト**

```typescript
// tests/engine/state/reducePlaceholder.test.ts
import { describe, expect, it } from 'vitest';
import { reduce } from '@/engine/state/reduce';
import { EMPTY_PARTY, type GameState } from '@/engine/state/types';

describe('placeholder phases goBack routing', () => {
  it.each([
    ['training',  'edgeOfTown'],
    ['utilities', 'edgeOfTown'],
    ['maze',      'edgeOfTown'],
    ['tavern',    'castle'],
    ['boltac',    'castle'],
    ['temple',    'castle'],
    ['inn',       'castle'],
  ] as const)('%s + goBack → %s', (from, to) => {
    const state = { phase: from, sub: { kind: 'menu' }, party: EMPTY_PARTY } as GameState;
    expect(reduce(state, { type: 'goBack' })).toEqual({
      phase: to,
      sub: { kind: 'menu' },
      party: EMPTY_PARTY,
    });
  });
});
```

- [ ] **Step D2.2: テスト**

```bash
pnpm test reducePlaceholder
```

期待: 7/7 PASS

- [ ] **Step D2.3: コミット**

```bash
git add src/screens/Placeholder.tsx src/screens/Placeholder.css src/engine/state/reducePlaceholder.ts src/engine/state/reduce.ts tests/engine/state/reducePlaceholder.test.ts
git commit -m "feat(engine,screens): add placeholder reducer + UI for M2 stub screens"
```

### Task D3: 7 サブ画面ファイル作成

**Files:**
- Create: `src/screens/Training/index.tsx`
- Create: `src/screens/Utilities/index.tsx`
- Create: `src/screens/Tavern/index.tsx`
- Create: `src/screens/Boltac/index.tsx`
- Create: `src/screens/Temple/index.tsx`
- Create: `src/screens/Inn/index.tsx`
- Create: `src/screens/Maze/index.tsx`

- [ ] **Step D3.1: 7 ファイルを書く (各々 4 行程度)**

```typescript
// src/screens/Training/index.tsx
import { Placeholder } from '@/screens/Placeholder';

export function Training() {
  return <Placeholder titleKey="training.title" bodyKey="training.placeholder" backLabelKey="common.back" />;
}
```

同様に Utilities, Tavern, Boltac, Temple, Inn, Maze の 6 ファイルも作成 (各々 i18n キー名のみ違う)。

- [ ] **Step D3.2: i18n メッセージを 7 サブ画面分追加**

```typescript
// en
'training.title': 'Training Grounds',
'training.placeholder': 'Character creation will be available in M3.',
'utilities.title': 'Utilities',
'utilities.placeholder': 'Restart Out Party will be available in M5.',
'tavern.title': "Gilgamesh's Tavern",
'tavern.placeholder': 'Party formation will be available in M3.',
'boltac.title': "Boltac's Trading Post",
'boltac.placeholder': 'Trading will be available in M3.',
'temple.title': 'Temple of Cant',
'temple.placeholder': 'Save feature will be available in M5.',
'inn.title': "Adventurer's Inn",
'inn.placeholder': 'Stables rest will be available in M3.',
'maze.title': 'The Maze',
'maze.placeholder': 'Dungeon exploration will be available in M4.',

// ja (相応に翻訳)
'training.title': 'くんれんじょう',
'training.placeholder': 'キャラクター さくせいは M3 でかいほうされます。',
'utilities.title': 'ユーティリティ',
'utilities.placeholder': 'パーティ ふっきは M5 でかいほうされます。',
'tavern.title': 'ギルガメッシュの さかば',
'tavern.placeholder': 'パーティへんせいは M3 でかいほうされます。',
'boltac.title': 'ボルタックの しょうてん',
'boltac.placeholder': 'うりかいは M3 でかいほうされます。',
'temple.title': 'カント じいん',
'temple.placeholder': 'セーブきのうは M5 でかいほうされます。',
'inn.title': 'りゅうの やどや',
'inn.placeholder': 'やすみは M3 でかいほうされます。',
'maze.title': 'めいきゅう',
'maze.placeholder': 'たんさくは M4 でかいほうされます。',
```

- [ ] **Step D3.3: App.tsx に 7 phase 対応追加**

```typescript
import { Boltac } from '@/screens/Boltac';
import { Inn } from '@/screens/Inn';
import { Maze } from '@/screens/Maze';
import { Temple } from '@/screens/Temple';
import { Tavern } from '@/screens/Tavern';
import { Training } from '@/screens/Training';
import { Utilities } from '@/screens/Utilities';

// switch に追加
case 'training':  return <Training />;
case 'utilities': return <Utilities />;
case 'tavern':    return <Tavern />;
case 'boltac':    return <Boltac />;
case 'temple':    return <Temple />;
case 'inn':       return <Inn />;
case 'maze':      return <Maze />;
```

### Task D4: Placeholder スモークテスト

**Files:**
- Create: `tests/screens/Placeholder.test.tsx`

- [ ] **Step D4.1: テスト**

```typescript
// tests/screens/Placeholder.test.tsx
import { describe, expect, it, beforeEach } from 'vitest';
import { fireEvent, render, screen, cleanup } from '@testing-library/react';
import { App } from '@/App';
import { gameStore } from '@/store/gameStore';
import { EMPTY_PARTY } from '@/engine/state/types';

describe('placeholder screens render via App', () => {
  beforeEach(() => {
    cleanup();
    gameStore.setState({
      state: { phase: 'title', sub: { kind: 'main' } },
      lang: 'en',
      isAnimating: false,
      isBusy: false,
      inputQueue: [],
    });
  });

  it.each([
    ['training',  'Training Grounds',           'Character creation'],
    ['tavern',    "Gilgamesh's Tavern",         'Party formation'],
    ['boltac',    "Boltac's Trading Post",      'Trading'],
    ['temple',    'Temple of Cant',             'Save'],
    ['inn',       "Adventurer's Inn",           'Stables'],
    ['utilities', 'Utilities',                  'Restart'],
    ['maze',      'The Maze',                   'Dungeon'],
  ] as const)('renders %s with title and placeholder body', (phase, title, bodyContains) => {
    gameStore.setState({
      state: { phase, sub: { kind: 'menu' }, party: EMPTY_PARTY },
    });
    render(<App />);
    expect(screen.getByText(title)).toBeInTheDocument();
    expect(screen.getByText(new RegExp(bodyContains))).toBeInTheDocument();
  });

  it('Back button on placeholder transitions Tavern → Castle', () => {
    gameStore.setState({
      state: { phase: 'tavern', sub: { kind: 'menu' }, party: EMPTY_PARTY },
    });
    render(<App />);
    fireEvent.click(screen.getByText(/Back/));
    expect(gameStore.getState().state.phase).toBe('castle');
  });
});
```

- [ ] **Step D4.2: テスト**

```bash
pnpm test Placeholder
```

期待: 8/8 PASS

- [ ] **Step D4.3: 確認**

```bash
pnpm lint && pnpm typecheck && pnpm test
pnpm dev
```

ブラウザで:
- Title → New Game → Edge of Town → Training (T キー) → Placeholder 画面 → Back → Edge of Town
- Edge of Town → Castle (C) → Tavern (G) → Placeholder → Back → Castle
- 全 7 サブ画面で同じ挙動を確認

- [ ] **Step D4.4: コミット**

```bash
git add src/screens src/App.tsx src/i18n/messages.ts tests/screens/Placeholder.test.tsx
git commit -m "feat(screens): add 7 placeholder sub-screens for M2 navigation"
```

---

## Phase E: 統合テストとデプロイ (P50: 0.2 日)

### Task E1: gameStore テスト更新 (新しい初期 state 形)

**Files:**
- Modify: `tests/store/gameStore.test.ts`

- [ ] **Step E1.1: 既存テストを確認**

`tests/store/gameStore.test.ts` の `dispatch openSettings transitions to settings` 等が壊れていないか確認:

```bash
pnpm test gameStore
```

破綻していれば、初期 state や setState 呼び出しを修正する。

### Task E2: フル動作確認

- [ ] **Step E2.1: lint + typecheck + test 全通過**

```bash
pnpm lint && pnpm typecheck && pnpm test && pnpm build
```

期待: 全グリーン、build 成功、bundle サイズ 60 KB gzip 以内

- [ ] **Step E2.2: 開発サーバで End-to-End 手動確認**

```bash
pnpm dev
```

確認手順:
- [ ] Title → New Game (はじめから) → Edge of Town
- [ ] T キー → Training Grounds → Back → Edge of Town
- [ ] M キー → Maze → Back → Edge of Town
- [ ] U キー → Utilities → Back → Edge of Town
- [ ] C キー → Castle
- [ ] Castle で G/B/T/A → 各サブ画面 → Back → Castle
- [ ] Castle で E (Edge of Town) → Edge of Town
- [ ] Edge of Town で L → Leave Game 確認 → N (キャンセル) → メニューに戻る
- [ ] L → Y → Title へ戻る
- [ ] 言語切替 (EN/JA) で全画面のテキストが切り替わる
- [ ] ウィンドウリサイズで整数倍スケール維持

### Task E3: CHANGELOG + README 更新

**Files:**
- Modify: `CHANGELOG.md`
- Modify: `README.md`

- [ ] **Step E3.1: CHANGELOG.md にエントリ追加**

```markdown
### Chapter 1 / M2 - YYYY-MM-DD

#### Added

- Edge of Town menu (T/M/C/U/L) with hotkey support
- Castle hub menu (G/B/T/A/E)
- Leave Game confirmation dialog (Y/N)
- Placeholder screens for Training, Utilities, Tavern, Boltac, Temple, Inn, Maze
- Reusable `Menu` component with hotkey navigation
- New game flow: Title "New Game" now transitions to Edge of Town with empty party
- i18n messages for Edge of Town, Castle, and 7 sub-screen titles/placeholders

#### Notes

- All sub-screens (Training, Tavern, etc.) are placeholders showing "available in M{n}".
  M3 will implement Training/Tavern/Boltac/Inn (with Stables-only rest).
  M4 will implement Maze (3D wireframe view + 1F walking).
  M5 will implement Temple save and Utilities Restart.

#### Tests

- N/N tests passing across M files (added: M2 reducers + Menu component + Placeholder smoke)
- Bundle size: ~60 KB gzip (target ≤ 200 KB)
```

- [ ] **Step E3.2: README.md の進捗状況を更新**

```markdown
## 開発状況

- ✅ **Chapter 1 / M0 + M1**: プロジェクト基盤、Title 画面、i18n、状態管理、IndexedDB スケルトン
- ✅ **Chapter 1 / M2**: Edge of Town + Castle メニュー、7 サブ画面プレースホルダ、Leave Game 確認
- ⏳ **Chapter 1 / M3**: キャラ作成、Tavern パーティ編成、Boltac 売買、Inn (Stables)、Utilities
- ⏳ **Chapter 1 / M4**: 迷宮 1F 描画と歩行
- ⏳ **Chapter 1 / M5**: IndexedDB セーブ/ロード (Temple)
- ⏳ **Chapter 1 / M6**: i18n 仕上げ + 設定画面
- ⏳ **Chapter 1 / M7**: 統合テスト + デプロイ + ドキュメント
- ⏳ **Chapter 2+**: 戦闘、呪文、レベルアップ、B2F〜B10F、ボス、エンディング
```

- [ ] **Step E3.3: コミット**

```bash
git add CHANGELOG.md README.md
git commit -m "docs: M2 release notes (Castle + Edge of Town + placeholders)"
```

### Task E4: デプロイ

- [ ] **Step E4.1: GitHub に push**

```bash
git push origin main
```

- [ ] **Step E4.2: GitHub Actions CI を待つ**

```bash
gh run watch --exit-status
```

期待: 成功

- [ ] **Step E4.3: Vercel 自動デプロイを確認**

`https://wizardry-proving-grounds.vercel.app` で本番が更新されたことを確認。

- [ ] **Step E4.4: 本番動作確認**

ブラウザで Step E2.2 のチェックリストを再実行 (本番環境で)

---

## 完了基準 (Definition of Done for M2)

- [ ] Edge of Town メニュー (5 項目、ホットキー T/M/C/U/L) が動作
- [ ] Castle メニュー (5 項目、ホットキー G/B/T/A/E) が動作
- [ ] 7 サブ画面 (Training/Utilities/Tavern/Boltac/Temple/Inn/Maze) がプレースホルダとして表示され Back で戻れる
- [ ] Leave Game 確認ダイアログが Y/N で動作
- [ ] Title から New Game で Edge of Town へ遷移し、Edge of Town から Leave Game で Title へ戻れる
- [ ] 全テスト PASS、CI が main で成功
- [ ] Vercel 本番に反映、URL で全フロー再現可能
- [ ] CHANGELOG/README 更新済み

完了したら次の Plan: `2026-XX-XX-chapter1-m3-character-creation.md` (キャラ作成・Tavern・Boltac・Inn(Stables)・Utilities) を作成して進める。
