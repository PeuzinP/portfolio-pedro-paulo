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
  { label: 'Matrícula', team: 'equipe de matrículas', topic: 'matrícula' },
  { label: 'Financeiro', team: 'equipe financeira', topic: 'financeiro' },
  { label: 'Suporte', team: 'equipe de suporte', topic: 'suporte' },
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
        ? `Simulação concluída: contato encaminhado para a ${intention.team}.`
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
  'Automação de atendimento e qualificação de leads',
  'Gestão de solicitações de cancelamento',
  'Automação de acessos em plataforma educacional',
  'Orquestrador de integrações educacionais',
] as const

for (const title of projectTitles) {
  test(`project details support keyboard navigation: ${title}`, async ({ page }) => {
    const card = page.locator('#projetos').getByRole('article').filter({ has: page.getByRole('heading', { name: title, exact: true }) })
    const opener = card.getByRole('button', { name: 'Explorar projeto' })
    await opener.focus()
    await page.keyboard.press('Enter')
    const dialog = page.getByRole('dialog', { name: title })
    await expect(dialog).toBeVisible()
    const close = dialog.getByRole('button', { name: 'Fechar detalhes do projeto' })
    await expect(close).toBeFocused()
    for (const heading of [/Contexto/, /Problema/, /Solução/, /Fluxo/, /Tecnologias e conceitos/, /Benefício operacional/]) {
      await expect(dialog.getByRole('heading', { name: heading })).toBeVisible()
    }
    await expect(dialog.locator('.case-flow > li')).toHaveCount(5)
    await page.keyboard.press('Tab')
    await expect(dialog.getByRole('link', { name: 'Vamos conversar sobre soluções' })).toBeFocused()
    await page.keyboard.press('Shift+Tab')
    await expect(close).toBeFocused()
    await page.keyboard.press('Escape')
    await expect(dialog).toHaveCount(0)
    await expect(opener).toBeFocused()
  })
}

test('the educational orchestrator is clearly a plan rather than a delivered system', async ({ page }) => {
  const title = 'Orquestrador de integrações educacionais'
  const card = page.locator('#projetos').getByRole('article').filter({ has: page.getByRole('heading', { name: title, exact: true }) })
  await expect(card.getByText('Em planejamento', { exact: true })).toBeVisible()
  await card.getByRole('button', { name: 'Explorar projeto' }).click()
  const dialog = page.getByRole('dialog', { name: title })
  await expect(dialog.getByText('Em planejamento', { exact: true })).toBeVisible()
  await expect(dialog).toContainText('não representa um sistema entregue ou em produção')
  await expect(dialog.getByRole('heading', { name: '03 / Solução proposta' })).toBeVisible()
  await expect(dialog.getByRole('heading', { name: '06 / Benefício operacional esperado' })).toBeVisible()
  for (const platform of ['TOTVS', 'Google', 'KeepEdu', 'Bernoulli', 'Rubeus']) {
    await expect(dialog.locator('.tag-list').getByText(platform, { exact: true })).toBeVisible()
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

for (const width of [360, 390, 768, 1440]) {
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
    const firstProject = page.locator('#projetos').getByRole('button', { name: 'Explorar projeto' }).first()
    await firstProject.click()
    const dialog = page.getByRole('dialog')
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
  for (const name of ['GitHub', 'Currículo']) {
    await expect(contact.getByRole('link', { name })).toHaveCount(0)
  }
  await expect(page.locator('a[href=""], a[href="#"], a[href^="javascript:"]')).toHaveCount(0)
  await contact.getByRole('link', { name: 'Voltar ao início' }).click()
  await expect(page).toHaveURL(/#inicio$/)
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
  await expect(demo.getByRole('status')).toHaveText('Simulação concluída: contato encaminhado para a equipe financeira.', { timeout: 7_000 })
  await expect(demo.getByRole('button', { name: 'Simular atendimento' })).toBeEnabled()
  await expect(demo.getByRole('combobox', { name: 'Qual é a intenção?' })).toBeEnabled()
  await expect(demo.getByRole('radio', { name: /Fora do horário/ })).toBeEnabled()
})
})
