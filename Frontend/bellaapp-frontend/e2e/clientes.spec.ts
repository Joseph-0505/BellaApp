import { test, expect } from '@playwright/test'
import { login } from './helpers/auth'

test.describe('CRUD Clientes', () => {
  test.beforeEach(async ({ page }) => {
    await login(page)
    await page.goto('/clientes')
    await page.waitForSelector('.clientes-page')
  })

  test('listar - página carrega corretamente', async ({ page }) => {
    await expect(page.locator('.clientes-page')).toBeVisible()
    await expect(page.locator('button.btn-soft')).toContainText('Novo Cliente')
  })

  test('criar cliente - sucesso', async ({ page }) => {
    const nome = `Cliente E2E ${Date.now()}`

    await page.click('button.btn-soft')
    await page.fill('#novo-cliente-nome', nome)
    await page.fill('#novo-cliente-telefone', '(11) 99999-9999')
    await page.click('.form-modal-button-primary')

    await expect(page.locator('.clientes-page')).toContainText(nome)
  })

  test('criar cliente - falha ao omitir campos obrigatórios', async ({ page }) => {
    await page.click('button.btn-soft')
    await page.click('.form-modal-button-primary')
    // Modal permanece aberto pois os campos required não foram preenchidos
    await expect(page.locator('#novo-cliente-nome')).toBeVisible()
  })

  test('fluxo completo - criar, editar e excluir', async ({ page }) => {
    const nome = `CRUD E2E ${Date.now()}`
    const nomeEditado = `${nome} Editado`

    // Criar
    await page.click('button.btn-soft')
    await page.fill('#novo-cliente-nome', nome)
    await page.fill('#novo-cliente-telefone', '(11) 88888-8888')
    await page.click('.form-modal-button-primary')
    await expect(page.locator('.clientes-page')).toContainText(nome)

    // Editar
    const row = page.locator('article.cliente-row', { hasText: nome })
    await row.locator('button.menu-trigger').click()
    await page.click('button.menu-item:has-text("Editar")')
    await page.fill('#novo-cliente-nome', nomeEditado)
    await page.click('.form-modal-button-primary')
    await expect(page.locator('.clientes-page')).toContainText(nomeEditado)

    // Excluir
    const editedRow = page.locator('article.cliente-row', { hasText: nomeEditado })
    page.once('dialog', dialog => dialog.accept())
    await editedRow.locator('button.menu-trigger').click()
    await page.click('button.menu-item:has-text("Excluir")')
    await expect(page.locator('.clientes-page')).not.toContainText(nomeEditado)
  })
})
