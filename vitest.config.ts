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
    // - tests/visual/**: Playwright tests (vitest が拾うと import 解決で壊れる)
    // - .worktrees/**: 他 worktree のテストを拾わない (cwd / node_modules が不一致になる)
    exclude: ['**/node_modules/**', '**/dist/**', '**/.worktrees/**', '**/tests/visual/**'],
  },
});
