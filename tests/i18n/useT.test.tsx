import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import { useT } from '@/i18n/useT';
import { gameStore } from '@/store/gameStore';

function Sample() {
  const t = useT();
  return <span>{t('title.menu.newGame')}</span>;
}

describe('useT', () => {
  beforeEach(() => {
    cleanup();
  });

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
