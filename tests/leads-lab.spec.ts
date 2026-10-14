import { expect, test } from '@playwright/test'

test('laboratório encaminha matrícula ao Comercial no horário comercial', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('button', { name: 'Simular atendimento' }).click()
  await expect(page.getByRole('region', { name: /Teste a lógica/i }).getByRole('status')).toContainText('comercial', { timeout: 5000 })
})

test('laboratório registra retorno fora do horário', async ({ page }) => {
  await page.goto('/')
  await page.getByLabel('Fora do horário').click()
  await page.getByRole('button', { name: 'Simular atendimento' }).click()
  await expect(page.getByRole('region', { name: /Teste a lógica/i }).getByRole('status')).toContainText('registrado para retorno', { timeout: 5000 })
})
