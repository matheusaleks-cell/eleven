import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright configuration for Eleven Dashboard testing sprints.
 * Supports both Desktop and Mobile viewports (including narrow 360px audit screens).
 */
export default defineConfig({
  testDir: './tests',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [
    ['list'],
    ['html', { open: 'never', outputFolder: 'playwright-report' }]
  ],
  use: {
    baseURL: process.env.BASE_URL || 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },

  projects: [
    {
      name: 'Desktop Chrome',
      use: { 
        ...devices['Desktop Chrome'],
        viewport: { width: 1440, height: 900 },
      },
    },
    {
      name: 'Mobile Narrow (360px - Auditoria)',
      use: {
        viewport: { width: 360, height: 740 },
        userAgent: 'Mozilla/5.0 (Linux; Android 13; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36',
        isMobile: true,
        hasTouch: true,
      },
    },
    {
      name: 'Mobile Standard (390px - iPhone 14)',
      use: {
        ...devices['iPhone 14'],
      },
    },
    {
      name: 'Tablet (768px - iPad)',
      use: {
        ...devices['iPad Mini'],
      },
    },
  ],

  /* Run local dev server before starting the tests if not already running */
  webServer: {
    command: process.platform === 'win32' ? 'npm.cmd run dev' : 'npm run dev',
    url: 'http://127.0.0.1:3000',
    reuseExistingServer: true,
    timeout: 120 * 1000,
  },
});
