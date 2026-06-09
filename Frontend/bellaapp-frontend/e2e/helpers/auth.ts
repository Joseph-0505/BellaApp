import { Page } from '@playwright/test'

export const TEST_EMAIL = process.env.TEST_USER_EMAIL || 'teste@bellaapp.com'
export const TEST_PASSWORD = process.env.TEST_USER_PASSWORD || 'Teste@1234'

export async function login(page: Page) {
  await page.goto('/login')
  await page.fill('#auth-email', TEST_EMAIL)
  await page.fill('#auth-password', TEST_PASSWORD)
  await page.click('.auth-button')
  await page.waitForURL(/\/(dashboard|onboarding)/)
}
