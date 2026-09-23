import { expect, test } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'

/**
 * Jornada 1 da fase 0: entrar no sistema.
 * Se isto quebra, ninguém trabalha — por isso é E2E e não teste de integração.
 *
 * As credenciais vêm do seed base. Em CI, o job de E2E roda o seed antes e
 * exporta E2E_SENHA.
 */
const EMAIL = process.env['E2E_EMAIL'] ?? 'admin@pureus.local'
const SENHA = process.env['E2E_SENHA'] ?? ''

test.describe('acesso ao sistema', () => {
  test('rota protegida redireciona para o login', async ({ page }) => {
    await page.goto('/')
    await expect(page).toHaveURL(/\/login/)
    await expect(page.getByRole('heading', { name: 'KAIROS' })).toBeVisible()
  })

  test('credencial inválida mostra erro genérico, sem revelar o motivo', async ({
    page,
  }) => {
    await page.goto('/login')
    await page.getByLabel('E-mail').fill('ninguem@pureus.local')
    await page.getByLabel('Senha').fill('senha-errada-mesmo')
    await page.getByRole('button', { name: 'Entrar' }).click()

    // O anunciador de rota do Next também usa role=alert: escopar ao formulário.
    const alerta = page.locator('form').getByRole('alert')
    await expect(alerta).toBeVisible()
    await expect(alerta).toHaveText('E-mail ou senha incorretos.')
  })

  test('login válido abre a tela inicial com a empresa', async ({ page }) => {
    test.skip(!SENHA, 'Defina E2E_SENHA com a senha gerada pelo seed base.')

    await page.goto('/login')
    await page.getByLabel('E-mail').fill(EMAIL)
    await page.getByLabel('Senha').fill(SENHA)
    await page.getByRole('button', { name: 'Entrar' }).click()

    await expect(page).toHaveURL('/')
    await expect(page.getByRole('heading', { level: 1 })).toContainText('Bom trabalho')
    await expect(page.getByRole('navigation', { name: 'Módulos' })).toContainText(
      'Processos',
    )
  })

  test('sair encerra a sessão e protege as rotas de novo', async ({ page }) => {
    test.skip(!SENHA, 'Defina E2E_SENHA com a senha gerada pelo seed base.')

    await page.goto('/login')
    await page.getByLabel('E-mail').fill(EMAIL)
    await page.getByLabel('Senha').fill(SENHA)
    await page.getByRole('button', { name: 'Entrar' }).click()
    await expect(page).toHaveURL('/')

    await page.getByRole('button', { name: 'Sair' }).click()
    await expect(page).toHaveURL(/\/login/)

    // A sessão acabou de fato: voltar para a tela inicial exige login.
    await page.goto('/')
    await expect(page).toHaveURL(/\/login/)
  })

  test('a tela de login não tem violação séria de acessibilidade', async ({ page }) => {
    await page.goto('/login')

    const resultado = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze()

    const graves = resultado.violations.filter(
      (v) => v.impact === 'serious' || v.impact === 'critical',
    )

    expect(graves.map((v) => `${v.id}: ${v.help}`)).toEqual([])
  })

  test('o login funciona só pelo teclado', async ({ page }) => {
    // Quem lança pedido o dia inteiro não usa mouse.
    await page.goto('/login')

    // O campo de e-mail recebe foco sozinho ao abrir a tela.
    await expect(page.getByLabel('E-mail')).toBeFocused()

    await page.keyboard.type('alguem@pureus.local')
    await page.keyboard.press('Tab')
    await expect(page.getByLabel('Senha')).toBeFocused()

    await page.keyboard.type('umaSenhaQualquer')
    // Enter dentro do campo envia o formulário, sem passar pelo botão.
    await page.keyboard.press('Enter')

    await expect(page.locator('form').getByRole('alert')).toBeVisible()
  })
})
