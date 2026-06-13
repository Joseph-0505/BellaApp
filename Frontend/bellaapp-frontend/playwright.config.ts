import { defineConfig, devices } from '@playwright/test'

// Padrao: stack Docker (nginx em https://bellaapp.local). Para rodar contra o dev
// server local do Vite, defina PLAYWRIGHT_BASE_URL=http://localhost:5173.
const baseURL = process.env.PLAYWRIGHT_BASE_URL || 'https://bellaapp.local'
const usingDocker = baseURL.includes('bellaapp.local')

export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  retries: 0,
  workers: 1,
  reporter: [['html', { open: 'never' }]],
  use: {
    baseURL,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    ignoreHTTPSErrors: true,
  },
  ...(usingDocker ? {} : {
    webServer: {
      command: 'npm run dev',
      url: 'http://localhost:5173',
      reuseExistingServer: true,
      timeout: 120_000,
    },
  }),
  projects: [
    {
      name: 'setup',
      testMatch: /.*\.setup\.ts/,
    },
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
      dependencies: ['setup'],
      testIgnore: /.*\.setup\.ts/,
    },
  ],
})
