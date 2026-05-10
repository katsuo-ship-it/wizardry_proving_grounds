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
    // 他 worktree (.worktrees/*) のテストを拾わない。各 worktree は自分の cwd で
    // pnpm test を走らせるべきで、main worktree から横断実行しても解決パスや
    // node_modules が一致せず壊れる
    exclude: ['**/node_modules/**', '**/dist/**', '**/.worktrees/**'],
  },
});
