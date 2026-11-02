import { defineConfig } from '@playwright/test'

export default defineConfig({
  testDir: '.',
  testMatch: 'demo-state.browser.ts',
  workers: 1,
  forbidOnly: !!process.env.CI,
  outputDir: 'results',
  use: {
    baseURL: 'http://127.0.0.1:5173',
    headless: true,
    launchOptions: { executablePath: process.env.CHROMIUM_PATH },
  },
  webServer: {
    command: 'VITE_DEMO=1 pnpm dev --host 127.0.0.1 --port 5173 --strictPort',
    url: 'http://127.0.0.1:5173/team',
    reuseExistingServer: !process.env.CI,
    cwd: '..',
  },
})
