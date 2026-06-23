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
    await expect(page.getByRole('button', { name: '+ Novo Cliente' })).toBeVisible()
  })

  test('criar cliente - sucesso', async ({ page }) => {
    const nome = `Cliente E2E ${Date.now()}`

    await page.getByRole('button', { name: '+ Novo Cliente' }).click()
    await page.fill('#novo-cliente-nome', nome)
    await page.fill('#novo-cliente-telefone', '(11) 99999-9999')
    await page.click('.form-modal-button-primary')

    await expect(page.locator('.clientes-page')).toContainText(nome)
  })

  test('criar cliente - falha ao omitir campos obrigatórios', async ({ page }) => {
    await page.getByRole('button', { name: '+ Novo Cliente' }).click()
    await page.click('.form-modal-button-primary')

    await expect(page.locator('#novo-cliente-nome')).toBeVisible()
  })

  test('fluxo completo - criar, listar, editar e excluir', async ({ page }) => {
    const nome = `CRUD E2E ${Date.now()}`
    const nomeEditado = `${nome} Editado`

    // Cadastrar
    await page.getByRole('button', { name: '+ Novo Cliente' }).click()
    await page.fill('#novo-cliente-nome', nome)
    await page.fill('#novo-cliente-telefone', '(11) 88888-8888')
    await page.click('.form-modal-button-primary')
    await expect(page.locator('.clientes-page')).toContainText(nome)

    // Listar: recarrega a página e confirma que o cliente persistiu na listagem vinda do servidor
    await page.reload()
    await page.waitForSelector('.clientes-page')
    await expect(page.locator('article.cliente-row', { hasText: nome })).toBeVisible()

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

    // Listar novamente: confirma que a exclusão persistiu no servidor
    await page.reload()
    await page.waitForSelector('.clientes-page')
    await expect(page.locator('article.cliente-row', { hasText: nomeEditado })).toHaveCount(0)
  })
})
