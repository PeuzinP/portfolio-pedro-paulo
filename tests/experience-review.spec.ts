import { expect, test as base } from '@playwright/test'
import type { Page } from '@playwright/test'

const title = 'Automação de Avaliações de Experiência'

const test = base.extend<{ errorMonitor: void }>({
  errorMonitor: [async ({ page }, use) => {
    const errors: string[] = []
    page.on('pageerror', error => errors.push(error.message))
    page.on('console', message => {
      if (message.type() === 'error') errors.push(message.text())
    })
    await use()
    expect(errors, 'The HR project should not cause browser errors').toEqual([])
  }, { auto: true }],
})

test.use({ contextOptions: { reducedMotion: 'reduce' } })

async function openProject(page: Page) {
  await page.goto('/')
  const card = page.locator('#projetos').getByRole('article').filter({ has: page.getByRole('heading', { name: title, exact: true }) })
  await expect(card).toContainText('Automação de Processos · RH · Integrações')
  await expect(card).toContainText('Em aplicação')
  await card.getByRole('link', { name: 'Ver estudo de caso' }).click()
  await expect(page).toHaveURL(/\/projetos\/avaliacoes-experiencia$/)
  const dialog = page.getByRole('main')
  await expect(dialog.getByRole('heading', { level: 1, name: title })).toBeVisible()
  await expect(dialog).toBeVisible()
  return { card, dialog }
}

test('HR project shows its current application status and expected benefits', async ({ page }) => {
  const { dialog } = await openProject(page)
  await expect(dialog.getByText('Em aplicação', { exact: true })).toBeVisible()
  await expect(dialog.getByRole('heading', { name: 'Estágio do projeto' })).toBeVisible()
  await expect(dialog).toContainText('Solução em aplicação no acompanhamento das avaliações de experiência de 30 e 90 dias.')
  await expect(dialog).not.toContainText('Em desenvolvimento e homologação')
  await expect(dialog.locator('.case-scope li')).toHaveCount(10)
  await expect(dialog.getByRole('heading', { name: 'Minha atuação' })).toBeVisible()
  await expect(dialog.locator('.case-contribution')).toContainText('Estruturei o fluxo do processo')
  await expect(dialog.locator('.case-steps > li')).toHaveCount(6)
  await expect(dialog.getByRole('heading', { name: 'Benefícios esperados para a operação.' })).toBeVisible()
  await expect(dialog.locator('.case-results li')).toHaveCount(5)
  await expect(dialog.locator('.case-tech-summary span')).toHaveText(['JavaScript', 'Google Apps Script', 'Google Sheets', 'Google Forms', 'Gmail API', 'Google Drive', 'HTML', 'CSS'])
  await dialog.getByRole('link', { name: 'Voltar aos projetos' }).click()
  await expect(page.locator('#competencias')).toContainText('automatizar processos internos de RH, com gestão de prazos, aprovações, notificações e integração entre áreas')
})

for (const period of [30, 90] as const) {
  test(`HR simulation completes the ${period}-day cycle locally with reduced motion`, async ({ page }) => {
    const { dialog } = await openProject(page)
    const demo = dialog.getByRole('region', { name: 'Simule o ciclo de avaliação' })
    const externalRequests: string[] = []
    page.on('request', request => {
      if (!request.url().startsWith('http://127.0.0.1:5173/') && !request.url().startsWith('data:')) externalRequests.push(request.url())
    })
    await expect(demo.getByText('Demonstração com dados fictícios', { exact: true })).toBeVisible()
    await expect(demo.getByText('Colaborador fictício', { exact: true })).toBeVisible()
    await expect(demo.locator('.hd-person')).toContainText('Alex')
    await expect(demo.locator('.hd-status-value')).toHaveText('Programada')
    await expect(demo.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '0')
    await demo.getByRole('radio', { name: `${period} dias`, exact: true }).check()
    await expect(demo.locator('.hd-record-fields')).toContainText(`${period}º dia após admissão`)
    await demo.getByRole('button', { name: 'Simular fluxo', exact: true }).click()
    await expect(demo.getByRole('status')).toHaveText(`Simulação de ${period} dias concluída: informações encaminhadas a DP / Gente & Gestão.`)
    await expect(demo.locator('.hd-status-value')).toHaveText('Encaminhada')
    await expect(demo.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '6')
    await expect(demo.locator('.hd-node--done')).toHaveCount(6)
    await expect(demo.locator('.hd-connector i')).toHaveCount(0)
    await expect(demo.getByRole('button', { name: 'Simular fluxo', exact: true })).toBeEnabled()
    await expect(demo.locator('.hd-disclaimer')).toContainText('Simulação local: não envia e-mails, registra avaliações reais ou acessa dados corporativos.')
    expect(externalRequests, 'The HR simulation must stay entirely local').toEqual([])
  })
}

test('HR period changes and reset clear the result and allow replay', async ({ page }) => {
  const { dialog } = await openProject(page)
  const demo = dialog.getByRole('region', { name: 'Simule o ciclo de avaliação' })
  const run = demo.getByRole('button', { name: 'Simular fluxo', exact: true })
  const reset = demo.getByRole('button', { name: 'Reiniciar demonstração' })
  await expect(reset).toBeDisabled()
  await run.click()
  await expect(demo.getByRole('status')).toContainText('Simulação de 30 dias concluída')
  await demo.getByRole('radio', { name: '90 dias', exact: true }).check()
  await expect(demo.locator('.hd-status-value')).toHaveText('Programada')
  await expect(demo.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '0')
  await expect(demo.getByRole('status')).toContainText('Escolha um período')
  await expect(demo.locator('.hd-node--done')).toHaveCount(0)
  await run.click()
  await expect(demo.getByRole('status')).toContainText('Simulação de 90 dias concluída')
  await reset.click()
  await expect(reset).toBeDisabled()
  await expect(demo.getByRole('radio', { name: '90 dias', exact: true })).toBeChecked()
  await expect(demo.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '0')
  await run.click()
  await expect(demo.getByRole('status')).toContainText('Simulação de 90 dias concluída')
})

test('HR nodes, periods and return navigation are usable with keyboard', async ({ page }) => {
  const { dialog } = await openProject(page)
  const demo = dialog.getByRole('region', { name: 'Simule o ciclo de avaliação' })
  await demo.getByRole('radio', { name: '30 dias', exact: true }).focus()
  await expect(demo.getByRole('radio', { name: '30 dias', exact: true })).toBeFocused()
  await page.keyboard.press('ArrowRight')
  await expect(demo.getByRole('radio', { name: '90 dias', exact: true })).toBeChecked()
  const director = demo.getByRole('button', { name: /^Diretoria/ })
  await director.focus()
  await page.keyboard.press('Enter')
  await expect(director).toHaveAttribute('aria-pressed', 'true')
  await expect(demo.locator('.hd-node[aria-pressed="true"]')).toHaveCount(1)
  await expect(demo.locator('.hd-role')).toContainText('participa da etapa de ciência e decisão')
  await expect(demo.locator('.hd-connector--selected')).toHaveCount(2)
  await expect(demo.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '0')
  await page.keyboard.press('Tab')
  const people = demo.getByRole('button', { name: /^DP \/ Gente & Gestão/ })
  await expect(people).toBeFocused()
  await page.keyboard.press('Space')
  await expect(people).toHaveAttribute('aria-pressed', 'true')
  await expect(demo.locator('.hd-role')).toContainText('acompanhar pendências e os próximos passos internos')
  await page.keyboard.press('Tab')
  await expect(dialog.getByRole('link', { name: 'Entrar em contato' })).toBeFocused()
  await dialog.getByRole('link', { name: 'Voltar aos projetos' }).focus()
  await page.keyboard.press('Enter')
  await expect(page).toHaveURL(/\/#projetos$/)
  await expect(page.locator('#projetos')).toBeVisible()
})

for (const width of [360, 390] as const) {
  test(`HR details and interactive panel fit the viewport at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 844 })
    const { dialog } = await openProject(page)
    const demo = dialog.getByRole('region', { name: 'Simule o ciclo de avaliação' })
    await demo.scrollIntoViewIfNeeded()
    expect(await dialog.evaluate(element => element.scrollWidth <= element.clientWidth + 1)).toBe(true)
    expect(await demo.evaluate(element => element.scrollWidth <= element.clientWidth + 1)).toBe(true)
    const bounds = await dialog.boundingBox()
    expect(bounds).not.toBeNull()
    expect(bounds!.x).toBeGreaterThanOrEqual(0)
    expect(bounds!.x + bounds!.width).toBeLessThanOrEqual(width + 1)
    await demo.getByRole('radio', { name: '90 dias', exact: true }).check()
    await demo.getByRole('button', { name: 'Simular fluxo', exact: true }).click()
    await expect(demo.getByRole('status')).toContainText('Simulação de 90 dias concluída')
    expect(await dialog.evaluate(element => element.scrollWidth <= element.clientWidth + 1)).toBe(true)
    await dialog.getByRole('link', { name: 'Voltar aos projetos' }).click()
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1)).toBe(true)
  })
}

test.describe('HR with motion enabled', () => {
  test.use({ contextOptions: { reducedMotion: 'no-preference' } })

  test('HR animation moves through all illustrative states then permits replay', async ({ page }) => {
    const { dialog } = await openProject(page)
    const demo = dialog.getByRole('region', { name: 'Simule o ciclo de avaliação' })
    await demo.getByRole('radio', { name: '90 dias', exact: true }).check()
    await demo.getByRole('button', { name: 'Simular fluxo', exact: true }).click()
    await expect(demo.getByRole('button', { name: 'Simulando…', exact: true })).toBeDisabled()
    await expect(demo.getByRole('radio', { name: '30 dias', exact: true })).toBeEnabled()
    await expect(demo.locator('.hd-connector i')).toHaveCount(1)
    for (const state of ['Programada', 'Aguardando avaliação', 'Respondida', 'Aguardando ciência', 'Encaminhada']) {
      await expect(demo.locator('.hd-status-value')).toHaveText(state)
    }
    await expect(demo.getByRole('status')).toHaveText('Simulação de 90 dias concluída: informações encaminhadas a DP / Gente & Gestão.')
    await expect(demo.locator('.hd-node--done')).toHaveCount(6)
    await expect(demo.getByRole('button', { name: 'Simular fluxo', exact: true })).toBeEnabled()
    await expect(demo.locator('.hd-connector i')).toHaveCount(0)
  })

  test('HR running flow can be cancelled, changed, and closed without stale updates', async ({ page }) => {
    const { card, dialog } = await openProject(page)
    const demo = dialog.getByRole('region', { name: 'Simule o ciclo de avaliação' })
    await demo.getByRole('button', { name: 'Simular fluxo', exact: true }).click()
    await expect(demo.getByRole('button', { name: 'Simulando…', exact: true })).toBeDisabled()
    await demo.getByRole('button', { name: 'Reiniciar demonstração' }).click()
    await expect(demo.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '0')
    await demo.getByRole('button', { name: 'Simular fluxo', exact: true }).click()
    await demo.getByRole('radio', { name: '90 dias', exact: true }).check()
    await expect(demo.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '0')
    await demo.getByRole('button', { name: 'Simular fluxo', exact: true }).click()
    await dialog.getByRole('link', { name: 'Voltar aos projetos' }).click()
    await expect(page).toHaveURL(/\/#projetos$/)
    await card.getByRole('link', { name: 'Ver estudo de caso' }).click()
    const freshDemo = page.getByRole('region', { name: 'Simule o ciclo de avaliação' })
    await expect(freshDemo.getByRole('radio', { name: '30 dias', exact: true })).toBeChecked()
    // Advance past every cancelled callback to catch updates leaking from the old run.
    await page.clock.install()
    await page.clock.runFor(6_000)
    await expect(freshDemo.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '0')
    await expect(freshDemo.locator('.hd-status-value')).toHaveText('Programada')
    await expect(freshDemo.getByRole('status')).toContainText('Escolha um período')
    await page.getByRole('link', { name: 'Voltar aos projetos' }).click()
    await expect(page).toHaveURL(/\/#projetos$/)
  })
})
