import { test, expect } from '@playwright/test'
import { login } from './helpers/auth'

test.describe('CRUD Serviços', () => {
  test.beforeEach(async ({ page }) => {
    await login(page)
    await page.goto('/servicos')
    await page.waitForSelector('.services-page')
  })

  test('listar - página carrega corretamente', async ({ page }) => {
    await expect(page.locator('.services-page')).toBeVisible()
    await expect(page.locator('button.btn-primary')).toContainText('Novo Serviço')
  })

  test('criar serviço - sucesso', async ({ page }) => {
    const nome = `Serviço E2E ${Date.now()}`

    await page.click('button.btn-primary')
    await page.fill('#novo-servico-nome', nome)
    await page.fill('#novo-servico-preco', '150')
    await page.click('.form-modal-button-primary')

    await expect(page.locator('.services-page')).toContainText(nome)
  })

  test('criar serviço - falha ao omitir nome', async ({ page }) => {
    await page.click('button.btn-primary')
    await page.fill('#novo-servico-preco', '150')
    await page.click('.form-modal-button-primary')
    await expect(page.locator('#novo-servico-nome')).toBeVisible()
  })

  test('fluxo completo - criar, listar, editar e excluir', async ({ page }) => {
    const nome = `CRUD Serv E2E ${Date.now()}`
    const nomeEditado = `${nome} Editado`

    // Cadastrar
    await page.click('button.btn-primary')
    await page.fill('#novo-servico-nome', nome)
    await page.fill('#novo-servico-preco', '200')
    await page.click('.form-modal-button-primary')
    await expect(page.locator('.services-page')).toContainText(nome)

    // Listar: recarrega a página e confirma que o serviço persistiu na listagem vinda do servidor
    await page.reload()
    await page.waitForSelector('.services-page')
    await expect(page.locator('article.service-row', { hasText: nome })).toBeVisible()

    // Editar
    const row = page.locator('article.service-row', { hasText: nome })
    await row.locator('button.menu-trigger').click()
    await page.click('button.menu-item:has-text("Editar")')
    await page.locator('#novo-servico-nome').fill(nomeEditado)
    await page.click('.form-modal-button-primary')
    await expect(page.locator('.services-page')).toContainText(nomeEditado)

    // Excluir
    const editedRow = page.locator('article.service-row', { hasText: nomeEditado })
    page.once('dialog', dialog => dialog.accept())
    await editedRow.locator('button.menu-trigger').click()
    await page.click('button.menu-item:has-text("Excluir")')
    await expect(page.locator('.services-page')).not.toContainText(nomeEditado)

    // Listar novamente: confirma que a exclusão persistiu no servidor
    await page.reload()
    await page.waitForSelector('.services-page')
    await expect(page.locator('article.service-row', { hasText: nomeEditado })).toHaveCount(0)
  })
})
