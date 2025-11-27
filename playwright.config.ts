import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: 'apps/tests-playwright',
  timeout: 30_000,
  expect: { timeout: 5_000 },
  reporter: [['list'], ['html', { outputFolder: 'playwright-report' }]],
  use: {
    baseURL: process.env.BASE_URL ?? 'http://localhost:3000',
    trace: 'on-first-retry',
    video: 'retain-on-failure',
  },
  projects: [
    {
      name: 'ui',
      testMatch: /.*\.spec\.ts/,
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'api',
      testDir: 'apps/tests-playwright/api',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'a11y',
      testDir: 'apps/tests-playwright/a11y',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'visual',
      testDir: 'apps/tests-playwright/visual',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
