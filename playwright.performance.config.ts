import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests/performance',
  fullyParallel: false,
  workers: 1,
  timeout: 360_000,
  expect: { timeout: 15_000 },
  reporter: process.env.CI ? [['line']] : [['list']],
  outputDir: 'test-results/performance-lab',
  use: {
    baseURL: 'http://localhost:3000',
    browserName: 'chromium',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure'
  },
  webServer: {
    command: 'npm run start -- -H localhost -p 3000',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 60_000,
    env: {
      ...process.env,
      DATABASE_URL: process.env.DATABASE_URL ?? ''
    }
  }
});
