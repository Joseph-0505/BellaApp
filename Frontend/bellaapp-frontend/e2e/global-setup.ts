import type { FullConfig } from '@playwright/test'

export default function globalSetup(_config: FullConfig) {
  if (!process.env.TEST_USER_EMAIL) {
    process.env.TEST_USER_EMAIL = `e2e-${Date.now()}@bellaapp.com`
  }
  if (!process.env.TEST_USER_PASSWORD) {
    process.env.TEST_USER_PASSWORD = 'Teste@1234'
  }
}
