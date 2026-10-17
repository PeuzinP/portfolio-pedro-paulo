import { expect, test } from '@playwright/test'

test('Bernoulli scenarios, reset and case study link work by keyboard', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('/')
  const lab = page.locator('.bl-section')
  const scenario = lab.getByLabel('Cenário fictício')
  const outcomes = {
    found: 'Status final: acesso desativado.',
    missing: 'Status final: não encontrado.',
    ambiguous: 'Mais de um resultado; operação interrompida.',
    completed: 'Status final: processo já concluído; duplicidade bloqueada.',
    'not-applicable': 'Status final: não se aplica ao segmento informado.',
    invalid: 'Status final: erro de validação.',
  }
  for (const [value, outcome] of Object.entries(outcomes)) {
    await scenario.selectOption(value)
    await lab.getByRole('button', { name: 'Iniciar simulação' }).focus()
    await page.keyboard.press('Enter')
    await expect(lab.getByRole('status')).toHaveText(outcome)
    await lab.getByRole('button', { name: 'Reiniciar' }).click()
    await expect(lab.getByRole('status')).toBeEmpty()
    await expect(lab.getByRole('log')).toContainText('Aguardando cenário para simular.')
  }
  await lab.getByRole('link', { name: 'Ver estudo de caso' }).click()
  await expect(page).toHaveURL(/\/projetos\/acessos-educacionais$/)
  await expect(page.getByRole('main')).toBeFocused()
})

test('Bernoulli animation can reset while running and replay safely', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' })
  await page.goto('/')
  const lab = page.locator('.bl-section')
  await lab.getByRole('button', { name: 'Iniciar simulação' }).click()
  await expect(lab.getByLabel('Cenário fictício')).toBeDisabled()
  await lab.getByRole('button', { name: 'Reiniciar' }).click()
  await lab.getByLabel('Cenário fictício').selectOption('invalid')
  await lab.getByRole('button', { name: 'Iniciar simulação' }).click()
  await expect(lab.getByRole('status')).toHaveText('Status final: erro de validação.')
  await expect(lab.getByRole('log')).not.toContainText('acesso desativado')
  await expect(lab.getByLabel('Cenário fictício')).toBeEnabled()
})
