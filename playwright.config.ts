import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: 0,
  workers: 1,
  use: {
    baseURL: 'http://localhost:3145',
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: {
    command: 'export DEVELOPER_DIR=/Library/Developer/CommandLineTools && pnpm start -p 3145',
    url: 'http://localhost:3145',
    reuseExistingServer: false,
    timeout: 30000,
  },
});
