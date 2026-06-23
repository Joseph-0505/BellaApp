import { test as setup, expect, request } from '@playwright/test'
import { generateCpf } from '../helpers/cpf'
import { TEST_EMAIL, TEST_PASSWORD } from '../helpers/auth'

const baseURL = process.env.PLAYWRIGHT_BASE_URL || 'https://bellaapp.local'
const apiBase = baseURL.includes('bellaapp.local') ? baseURL : 'http://localhost:3000'

const BUSINESS_NAME = 'Clinica E2E'

setup('provisiona usuario de teste (registro + onboarding)', async () => {
  const api = await request.newContext({ baseURL: apiBase, ignoreHTTPSErrors: true })

  const registerResponse = await api.post('/api/v1/auth/register', {
    data: {
      name: 'Usuario Teste E2E',
      email: TEST_EMAIL,
      password: TEST_PASSWORD,
      cpf: generateCpf(),
    },
  })
  expect(
    registerResponse.ok() || registerResponse.status() === 409,
    `Falha inesperada no registro: ${registerResponse.status()} ${await registerResponse.text()}`,
  ).toBeTruthy()

  const loginResponse = await api.post('/api/v1/auth/login', {
    data: { email: TEST_EMAIL, password: TEST_PASSWORD },
  })
  expect(
    loginResponse.ok(),
    `Falha no login: ${loginResponse.status()} ${await loginResponse.text()}`,
  ).toBeTruthy()
  const { data: session } = await loginResponse.json()
  const authHeaders = { Authorization: `Bearer ${session.token}` }

  const statusResponse = await api.get('/api/v1/onboarding/status', { headers: authHeaders })
  expect(
    statusResponse.ok(),
    `Falha ao consultar onboarding: ${statusResponse.status()} ${await statusResponse.text()}`,
  ).toBeTruthy()
  const { data: status } = await statusResponse.json()

  if (!status.completed) {
    const completeResponse = await api.post('/api/v1/onboarding/complete', {
      headers: authHeaders,
      data: { businessName: BUSINESS_NAME },
    })
    expect(
      completeResponse.ok(),
      `Falha ao concluir onboarding: ${completeResponse.status()} ${await completeResponse.text()}`,
    ).toBeTruthy()
  }

  await api.dispose()
})
