import { expect, test as base } from '@playwright/test'

// Every browser scenario also checks errors, including during navigation and animations.
const test = base.extend<{ errorMonitor: void }>({
  errorMonitor: [async ({ page }, use) => {
    const errors: string[] = []
    page.on('pageerror', error => errors.push(error.message))
    page.on('console', message => {
      if (message.type() === 'error') errors.push(message.text())
    })
    await use()
    expect(errors, 'The browser should not report console or uncaught JavaScript errors').toEqual([])
  }, { auto: true }],
})

test.use({ contextOptions: { reducedMotion: 'reduce' } })

test.beforeEach(async ({ page }) => {
  await page.goto('/')
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Olá, sou Pedro Paulo.')
})

const intentions = [
  { label: 'Matrícula', team: 'Comercial', topic: 'matrícula' },
  { label: 'Financeiro', team: 'Financeiro', topic: 'financeiro' },
  { label: 'Suporte', team: 'Suporte', topic: 'suporte' },
] as const

for (const hours of ['open', 'closed'] as const) {
  for (const intention of intentions) {
    test(`simulation: ${hours === 'open' ? 'business hours' : 'after hours'} / ${intention.label}`, async ({ page }) => {
      const demo = page.locator('#demonstracao')
      const externalRequests: string[] = []
      page.on('request', request => {
        if (!request.url().startsWith('http://127.0.0.1:5173/') && !request.url().startsWith('data:')) {
          externalRequests.push(request.url())
        }
      })
      await demo.getByRole('radio', { name: hours === 'open' ? /Horário comercial/ : /Fora do horário/ }).check()
      await demo.getByRole('combobox', { name: 'Qual é a intenção?' }).selectOption(intention.label)
      await demo.getByRole('button', { name: 'Simular atendimento' }).click()

      const result = hours === 'open'
        ? `Simulação concluída: encaminhamento para ${intention.team} realizado.`
        : `Simulação concluída: contato registrado para retorno sobre ${intention.topic}.`
      await expect(demo.getByRole('status')).toHaveText(result)
      await expect(demo.getByText('Concluído', { exact: true })).toBeVisible()
      await expect(demo.getByRole('button', { name: 'Simular atendimento' })).toBeEnabled()
      await expect(demo.getByText('Simulação local com dados fictícios. Sem disparos reais ou conexão com plataformas externas.')).toBeVisible()

      const selectedBranch = demo.locator('.ad-branch--selected')
      await expect(selectedBranch).toHaveCount(1)
      await expect(selectedBranch).toContainText(hours === 'open' ? 'Encaminhamento' : 'Registro para retorno')
      await expect(selectedBranch.locator('.ad-node--complete')).toHaveCount(2)
      await expect(demo.locator('.ad-branch:not(.ad-branch--selected) .ad-node--complete')).toHaveCount(0)
      expect(externalRequests, 'Simulation must not call external platforms').toEqual([])
    })
  }
}

test('changing the scenario clears the previous result and allows another simulation', async ({ page }) => {
  const demo = page.locator('#demonstracao')
  await demo.getByRole('button', { name: 'Simular atendimento' }).click()
  await expect(demo.getByRole('status')).toContainText('Simulação concluída')
  await demo.getByRole('radio', { name: /Fora do horário/ }).check()
  await expect(demo.getByRole('status')).toHaveText('Escolha um cenário e acompanhe o caminho do contato.')
  await expect(demo.locator('.ad-branch--selected')).toHaveCount(0)
  await demo.getByRole('combobox', { name: 'Qual é a intenção?' }).selectOption('Suporte')
  await demo.getByRole('button', { name: 'Simular atendimento' }).click()
  await expect(demo.getByRole('status')).toHaveText('Simulação concluída: contato registrado para retorno sobre suporte.')
})

test('project filters show the correct projects and selected state', async ({ page }) => {
  const projects = page.locator('#projetos')
  const filters = projects.getByRole('group', { name: 'Filtrar projetos por categoria' })
  await expect(projects.getByRole('article')).toHaveCount(6)
  for (const [name, count] of [['Automação', 3], ['Integrações', 2], ['Desenvolvimento', 2], ['Todos', 6]] as const) {
    const button = filters.getByRole('button', { name: new RegExp(`^${name}`) })
    await button.click()
    await expect(button).toHaveAttribute('aria-pressed', 'true')
    await expect(filters.locator('button[aria-pressed="true"]')).toHaveCount(1)
    await expect(projects.getByRole('article')).toHaveCount(count)
    await expect(projects.locator('.project-count')).toHaveText(`${count} ${count === 1 ? 'projeto' : 'projetos'}`)
    if (name === 'Integrações') {
      await expect(projects.getByRole('heading', { level: 3 })).toHaveText(['Automação de Avaliações de Experiência', 'Orquestrador de integrações educacionais'])
    }
    if (name === 'Desenvolvimento') {
      await expect(projects.getByRole('heading', { level: 3 })).toHaveText(['Reading KeepEdu — processamento e gestão de avaliações', 'Gestão de solicitações de cancelamento'])
    }
  }
})

const projectTitles = [
  'Reading KeepEdu — processamento e gestão de avaliações',
  'Automação de Avaliações de Experiência',
  'Automação de atendimento e qualificação de leads',
  'Gestão de solicitações de cancelamento',
  'Automação de acessos em plataforma educacional',
  'Orquestrador de integrações educacionais',
] as const

for (const title of projectTitles) {
  test(`project details support keyboard navigation: ${title}`, async ({ page }) => {
    const card = page.locator('#projetos').getByRole('article').filter({ has: page.getByRole('heading', { name: title, exact: true }) })
    const opener = card.getByRole('link', { name: 'Ver estudo de caso' })
    const destination = await opener.getAttribute('href')
    await opener.focus()
    await page.keyboard.press('Enter')
    await expect(page).toHaveURL(new RegExp(`${destination}$`))
    const details = page.getByRole('main')
    await expect(details.getByRole('heading', { level: 1, name: title })).toBeVisible()
    await expect(details.getByRole('heading', { name: /Contexto e propósito/ })).toBeVisible()
    await expect(details.locator('.case-steps > li')).toHaveCount(title.includes('Experiência') ? 6 : 5)
    await expect(details.locator('.project-status')).toBeVisible()
    const architecture = details.getByRole('region', { name: /Arquitetura do projeto/ })
    await architecture.focus()
    await expect(architecture).toBeFocused()
    const back = details.getByRole('link', { name: 'Voltar aos projetos' })
    await expect(back).toHaveAttribute('href', '/#projetos')
    await back.focus()
    await page.keyboard.press('Enter')
    await expect(page).toHaveURL(/\/#projetos$/)
    await expect(card).toBeVisible()
  })
}

test('the educational orchestrator is clearly a plan rather than a delivered system', async ({ page }) => {
  const title = 'Orquestrador de integrações educacionais'
  const card = page.locator('#projetos').getByRole('article').filter({ has: page.getByRole('heading', { name: title, exact: true }) })
  await expect(card.getByText('Em planejamento', { exact: true })).toBeVisible()
  await card.getByRole('link', { name: 'Ver estudo de caso' }).click()
  const dialog = page.getByRole('main')
  await expect(dialog.getByText('Em planejamento', { exact: true })).toBeVisible()
  await expect(dialog).toContainText('não representa um sistema entregue ou em produção')
  await expect(dialog.getByText('03 / SOLUÇÃO PROPOSTA')).toBeVisible()
  await expect(dialog.getByRole('heading', { name: 'Benefícios esperados para a operação.' })).toBeVisible()
  await expect(dialog.getByRole('heading', { name: 'Base técnica proposta.' })).toBeVisible()
  for (const platform of ['TOTVS', 'Google', 'KeepEdu', 'Bernoulli', 'Rubeus']) {
    await expect(dialog.locator('.case-tech-summary').getByText(platform, { exact: true })).toBeVisible()
  }
})

test('mobile navigation opens, closes, and follows section links with the keyboard', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  const toggle = page.getByRole('button', { name: /^(Abrir|Fechar) menu$/ })
  const navigation = page.getByRole('navigation', { name: 'Navegação principal' })
  await expect(navigation).toBeHidden()
  await toggle.focus()
  await page.keyboard.press('Enter')
  await expect(toggle).toHaveAttribute('aria-expanded', 'true')
  await expect(navigation).toBeVisible()
  await page.keyboard.press('Tab')
  await expect(navigation.getByRole('link', { name: 'Início', exact: true })).toBeFocused()
  await page.keyboard.press('Escape')
  await expect(navigation).toBeHidden()
  await expect(toggle).toBeFocused()
  await page.keyboard.press('Enter')
  await page.keyboard.press('Tab')
  await page.keyboard.press('Tab')
  await page.keyboard.press('Tab')
  await expect(navigation.getByRole('link', { name: 'Projetos', exact: true })).toBeFocused()
  await page.keyboard.press('Enter')
  await expect(page).toHaveURL(/#projetos$/)
  await expect(navigation).toBeHidden()
  await expect(toggle).toHaveAttribute('aria-expanded', 'false')
})

for (const width of [360, 390, 768, 1024, 1440]) {
  test(`the layout has no horizontal overflow at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 })
    for (const id of ['inicio', 'sobre', 'projetos', 'demonstracao', 'competencias', 'contato']) {
      await page.locator(`#${id}`).scrollIntoViewIfNeeded()
      const dimensions = await page.evaluate(() => ({
        viewport: document.documentElement.clientWidth,
        document: document.documentElement.scrollWidth,
        body: document.body.scrollWidth,
      }))
      expect(dimensions.document, `${id}: document overflow`).toBeLessThanOrEqual(dimensions.viewport + 1)
      expect(dimensions.body, `${id}: body overflow`).toBeLessThanOrEqual(dimensions.viewport + 1)
    }
    const firstProject = page.locator('#projetos').getByRole('link', { name: 'Ver estudo de caso' }).first()
    await firstProject.click()
    const dialog = page.getByRole('main')
    await expect(dialog).toBeVisible()
    expect(await dialog.evaluate(element => element.scrollWidth <= element.clientWidth + 1), 'Project details should fit the viewport').toBe(true)
    const bounds = await dialog.boundingBox()
    expect(bounds).not.toBeNull()
    expect(bounds!.x).toBeGreaterThanOrEqual(0)
    expect(bounds!.x + bounds!.width).toBeLessThanOrEqual(width + 1)
  })
}

test('configured contact channels use the supplied details and empty channels stay hidden', async ({ page }) => {
  const contact = page.locator('#contato')
  await contact.scrollIntoViewIfNeeded()
  await expect(contact.getByText('Canais de contato disponíveis em breve.')).toHaveCount(0)
  for (const [name, href] of [
    ['E-mail', 'mailto:ppmendes1519@gmail.com'],
    ['LinkedIn', 'https://www.linkedin.com/in/pedro-mendes-720830270/'],
    ['WhatsApp', 'https://wa.me/5586981419738'],
  ]) {
    const link = contact.getByRole('link', { name, exact: true })
    await expect(link).toBeVisible()
    await expect(link).toHaveAttribute('href', href)
  }
  for (const name of ['GitHub']) {
    await expect(contact.getByRole('link', { name })).toHaveCount(0)
  }
  const resume = contact.getByRole('link', { name: 'Currículo (abre em nova aba)' })
  await expect(resume).toHaveAttribute('href', '/curriculo-pedro-paulo.pdf')
  await expect(resume).toHaveAttribute('target', '_blank')
  await expect(resume).toHaveAttribute('rel', 'noopener noreferrer')
  expect(await resume.getAttribute('download')).toBeNull()
  await expect(page.locator('a[href=""], a[href="#"], a[href^="javascript:"]')).toHaveCount(0)
  await contact.getByRole('link', { name: 'Voltar ao início' }).click()
  await expect(page).toHaveURL('http://127.0.0.1:5173/')
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(0)
})

test('reduced motion stops automatic SVG movement while nodes remain operable', async ({ page }) => {
  expect(await page.evaluate(() => window.matchMedia('(prefers-reduced-motion: reduce)').matches)).toBe(true)
  await expect(page.locator('animateMotion')).toHaveCount(0)
  const flow = page.locator('.flow-shell')
  const validation = flow.getByRole('button', { name: /^Validação/ })
  await validation.focus()
  await page.keyboard.press('Enter')
  await expect(validation).toHaveAttribute('aria-pressed', 'true')
  await expect(flow.locator('.flow-caption')).toHaveText('As regras de negócio verificam se os dados estão prontos para seguir.')
  await expect(flow.locator('.connection-lit')).not.toHaveCount(0)
  await expect(flow.getByRole('button', { name: /animação do fluxo/ })).toBeDisabled()
})

test.describe('with motion enabled', () => {
  test.use({ contextOptions: { reducedMotion: 'no-preference' } })

test('the animation control pauses and resumes the hero flow', async ({ page }) => {
  const flow = page.locator('.flow-shell')
  await expect(flow.locator('animateMotion')).toHaveCount(1)
  await flow.getByRole('button', { name: 'Pausar animação do fluxo' }).click()
  await expect(flow.locator('animateMotion')).toHaveCount(0)
  await flow.getByRole('button', { name: 'Reproduzir animação do fluxo' }).click()
  await expect(flow.locator('animateMotion')).toHaveCount(1)
})

test('animated simulation locks its controls until the local flow finishes', async ({ page }) => {
  const demo = page.locator('#demonstracao')
  await demo.getByRole('combobox', { name: 'Qual é a intenção?' }).selectOption('Financeiro')
  await demo.getByRole('button', { name: 'Simular atendimento' }).click()
  await expect(demo.getByRole('button', { name: 'Simulando atendimento…' })).toBeDisabled()
  await expect(demo.getByRole('combobox', { name: 'Qual é a intenção?' })).toBeDisabled()
  await expect(demo.getByRole('radio', { name: /Fora do horário/ })).toBeDisabled()
  await expect(demo.getByRole('status')).toHaveText('Simulação concluída: encaminhamento para Financeiro realizado.', { timeout: 7_000 })
  await expect(demo.getByRole('button', { name: 'Simular atendimento' })).toBeEnabled()
  await expect(demo.getByRole('combobox', { name: 'Qual é a intenção?' })).toBeEnabled()
  await expect(demo.getByRole('radio', { name: /Fora do horário/ })).toBeEnabled()
})
})
