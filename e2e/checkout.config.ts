import { defineConfig } from '@playwright/test'

export default defineConfig({
  testDir: '.',
  testMatch: 'checkout.browser.ts',
  workers: 1,
  timeout: 60000,
  forbidOnly: !!process.env.CI,
  outputDir: 'results/checkout',
  use: {
    headless: true,
    ignoreHTTPSErrors: true,
    launchOptions: { executablePath: process.env.CHROMIUM_PATH },
  },
})
