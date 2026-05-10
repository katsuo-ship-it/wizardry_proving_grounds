import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/visual",
  snapshotDir: "./tests/visual/__snapshots__",
  expect: {
    toHaveScreenshot: { threshold: 0.005 },
  },
  use: {
    baseURL: "http://localhost:5173",
    viewport: { width: 800, height: 600 },
  },
  webServer: {
    command: "pnpm dev",
    url: "http://localhost:5173",
    reuseExistingServer: !process.env.CI,
  },
  projects: [
    {
      name: "chromium-linux",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
});
