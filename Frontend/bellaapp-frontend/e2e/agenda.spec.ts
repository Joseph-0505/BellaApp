import { expect, test } from '@playwright/test'
import { login } from './helpers/auth'

test.describe('Agenda pelo Nginx', () => {
  test.beforeEach(async ({ page }) => {
    await login(page)
    await page.goto('/agenda')
  })

  test('carrega a semana e os comandos principais', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Agenda', level: 1 })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Novo Agendamento' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Novo Cliente' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Semana anterior' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Próxima semana' })).toBeVisible()
    await expect(page.getByPlaceholder('Buscar cliente, serviço ou profissional')).toBeVisible()
  })
})
