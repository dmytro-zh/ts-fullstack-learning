import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: 'apps/tests-playwright',
  timeout: 30_000,
  expect: { timeout: 5_000 },
  reporter: [['list'], ['html', { outputFolder: 'playwright-report' }]],
  globalSetup: 'apps/tests-playwright/global-setup.ts',
  globalTeardown: 'apps/tests-playwright/global-teardown.ts',
  webServer: [
    {
      command:
        'pnpm -C apps/api exec prisma migrate deploy --schema=prisma/schema.prisma && pnpm -C apps/api run db:seed && pnpm -C apps/api dev',
      url: 'http://localhost:4000/health',
      timeout: 120_000,
      reuseExistingServer: true,
      env: {
        ...process.env,
        API_JWT_SECRET: process.env.API_JWT_SECRET ?? 'playwright-dev-secret',
      },
    },
    {
      command: 'pnpm -C apps/web build && pnpm -C apps/web start -p 3000',
      url: 'http://localhost:3000',
      timeout: 180_000,
      reuseExistingServer: false,
    },
  ],
  use: {
    baseURL: process.env.BASE_URL ?? 'http://localhost:3000',
    trace: 'on-first-retry',
    video: 'retain-on-failure',
  },
  projects: [
    {
      name: 'ui',
      testDir: 'apps/tests-playwright/e2e',
      testMatch: /.*\.spec\.ts/,
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'api',
      testDir: 'apps/tests-playwright/api',
      use: { baseURL: process.env.API_URL ?? 'http://localhost:4000/' },
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
