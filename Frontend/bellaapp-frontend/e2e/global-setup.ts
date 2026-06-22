import type { FullConfig } from '@playwright/test'

// Provisiona um usuario de teste UNICO por execucao da suite. Roda uma unica vez no
// processo principal, antes dos workers; como os workers herdam o environment, o
// mesmo e-mail e usado pelo projeto de setup (registro/onboarding) e por todos os
// testes. Isso evita flakes por estado acumulado no banco — em especial o trial
// expirar quando um usuario fixo e reaproveitado ao longo de varios dias.
//
// Se TEST_USER_EMAIL/PASSWORD ja vierem do ambiente (ex.: CI), eles sao respeitados.
export default function globalSetup(_config: FullConfig) {
  if (!process.env.TEST_USER_EMAIL) {
    process.env.TEST_USER_EMAIL = `e2e-${Date.now()}@bellaapp.com`
  }
  if (!process.env.TEST_USER_PASSWORD) {
    process.env.TEST_USER_PASSWORD = 'Teste@1234'
  }
}
