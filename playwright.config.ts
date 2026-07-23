import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './apps/web/e2e',
  timeout: 15_000,
  reporter: 'line',
  use: {
    baseURL: 'http://127.0.0.1:4173',
    trace: 'retain-on-failure',
  },
  webServer: {
    command:
      'node ../../node_modules/vite/bin/vite.js preview --host 127.0.0.1 --port 4173 --strictPort',
    cwd: './apps/web',
    url: 'http://127.0.0.1:4173',
    reuseExistingServer: true,
  },
});
