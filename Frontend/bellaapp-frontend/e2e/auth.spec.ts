import { test, expect } from '@playwright/test'

const TEST_EMAIL = process.env.TEST_USER_EMAIL || 'teste@bellaapp.com'
const TEST_PASSWORD = process.env.TEST_USER_PASSWORD || 'Teste@1234'

test.describe('Login', () => {
  test('sucesso - redireciona para dashboard ou onboarding', async ({ page }) => {
    await page.goto('/login')
    await page.fill('#auth-email', TEST_EMAIL)
    await page.fill('#auth-password', TEST_PASSWORD)
    await page.click('.auth-button')
    await expect(page).toHaveURL(/\/(dashboard|onboarding)/)
  })

  test('falha - credenciais inválidas exibem mensagem de erro', async ({ page }) => {
    await page.goto('/login')
    await page.fill('#auth-email', 'invalido@bellaapp.com')
    await page.fill('#auth-password', 'senhaerrada123')
    await page.click('.auth-button')
    await expect(page.locator('.auth-error')).toBeVisible()
  })
})

test.describe('Cadastro', () => {
  test('sucesso - exibe confirmação e retorna ao login', async ({ page }) => {
    const uniqueEmail = `e2e${Date.now()}@bellaapp.com`

    await page.goto('/login')
    await page.click('button:has-text("Criar conta")')
    await page.fill('#auth-name', 'Usuário E2E')
    await page.fill('#auth-cpf', '529.982.247-25')
    await page.fill('#auth-email', uniqueEmail)
    await page.fill('#auth-password', 'Teste@1234')
    await page.fill('#auth-confirm-password', 'Teste@1234')
    await page.click('.auth-button')

    await page.click('.swal2-confirm')
    await expect(page).toHaveURL(/\/login/)
  })

  test('falha - senhas não coincidem exibem erro', async ({ page }) => {
    await page.goto('/login')
    await page.click('button:has-text("Criar conta")')
    await page.fill('#auth-name', 'Usuário E2E')
    await page.fill('#auth-cpf', '529.982.247-25')
    await page.fill('#auth-email', 'qualquer@bellaapp.com')
    await page.fill('#auth-password', 'Teste@1234')
    await page.fill('#auth-confirm-password', 'SenhaDiferente@9999')
    await page.click('.auth-button')
    await expect(page.locator('.auth-error')).toBeVisible()
  })
})
