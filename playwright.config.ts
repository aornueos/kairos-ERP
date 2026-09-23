import { defineConfig, devices } from '@playwright/test'
import './load-env'

/**
 * E2E do KAIROS (ver skill e2e-testing).
 * Poucos testes, de alto valor, cobrindo as jornadas que não podem quebrar.
 */
export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: false,
  forbidOnly: !!process.env['CI'],
  retries: process.env['CI'] ? 1 : 0,
  workers: 1,
  reporter: process.env['CI'] ? [['github'], ['html', { open: 'never' }]] : [['list']],
  timeout: 60_000,

  use: {
    baseURL: process.env['E2E_BASE_URL'] ?? 'http://localhost:3000',
    locale: 'pt-BR',
    timezoneId: 'America/Sao_Paulo',
    // Artefato só quando falha: trace verde é lixo que enche o CI.
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },

  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],

  webServer: process.env['E2E_BASE_URL']
    ? undefined
    : {
        command: 'pnpm dev',
        url: 'http://localhost:3000/login',
        reuseExistingServer: !process.env['CI'],
        timeout: 120_000,
      },
})
