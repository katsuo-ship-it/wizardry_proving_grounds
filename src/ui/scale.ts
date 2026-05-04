/**
 * Apple II 仮想ピクセル (280×192) の整数倍スケール計算ユーティリティ。
 */

/** ウィンドウサイズから整数倍スケールを返す。最小 1。 */
export function computeScale(winWidth: number, winHeight: number): number {
  const sx = Math.floor(winWidth / 280);
  const sy = Math.floor(winHeight / 192);
  return Math.max(1, Math.min(sx, sy));
}

/** ブラウザの resize イベントを購読し、--scale CSS 変数を更新する。 */
export function subscribeScaleToWindow(): () => void {
  const apply = (): void => {
    const s = computeScale(window.innerWidth, window.innerHeight);
    document.documentElement.style.setProperty('--scale', String(s));
  };
  apply();
  window.addEventListener('resize', apply);
  return () => window.removeEventListener('resize', apply);
}

/**
 * Apple II 風 Web フォント (Print Char 21 / 美咲フォント) のロード完了を待つ。
 * FOUT (Flash of Unstyled Text) を防ぐため、アプリ起動前に呼ぶ。
 * 古いブラウザ (FontFace API 非対応) では即座に解決する。
 */
export async function waitForPixelFontsReady(): Promise<void> {
  if (typeof document === 'undefined' || !('fonts' in document)) return;
  try {
    await Promise.all([
      document.fonts.load('1em "Print Char 21"'),
      document.fonts.load('1em "Misaki Gothic"'),
    ]);
    await document.fonts.ready;
  } catch {
    // フォントロード失敗時もアプリ起動を継続 (フォールバック monospace)
  }
}
