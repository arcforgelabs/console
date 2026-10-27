import { defineConfig, devices } from '@playwright/test'

// Release-tier sign-in test (proof standard Rule 6): a real Keycloak with
// the arcforge theme, then the console. It runs before each release and on
// demand, not on every pull request. See e2e/README.md.
export default defineConfig({
  testDir: '.',
  timeout: 60_000,
  fullyParallel: false,
  workers: 1,
  forbidOnly: !!process.env.CI,
  reporter: process.env.CI
    ? [['list'], ['html', { open: 'never', outputFolder: 'report' }]]
    : 'list',
  outputDir: 'results',
  use: {
    ...devices['Desktop Chrome'],
    // Local runs may point at a browser that is already installed.
    launchOptions: { executablePath: process.env.CHROMIUM_PATH },
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [
    { name: 'desktop', use: { viewport: { width: 1280, height: 800 } } },
    {
      name: 'phone',
      use: { viewport: { width: 390, height: 844 }, isMobile: true },
    },
  ],
  // The console demo build (VITE_DEMO=1), the page a person lands on after
  // signing in. It has its own folder, so it never replaces dist/.
  webServer: {
    command:
      'VITE_DEMO=1 pnpm exec vite build --outDir dist-e2e && pnpm exec vite preview --outDir dist-e2e --port 4173 --strictPort',
    url: 'http://localhost:4173',
    reuseExistingServer: !process.env.CI,
    cwd: '..',
  },
})
