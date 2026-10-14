import { expect, test } from '@playwright/test'
import type { BrowserContext, Page } from '@playwright/test'

const keys = { consent: 'pp:visits:consent:v1', browser: 'pp:visits:browser:v1', session: 'pp:visits:session:v1' }
type Payload = { visitorId: string; eventId: string; consent: boolean }
function backend() {
  const requests: Payload[] = []
  const events = new Set<string>()
  const visitors = new Set<string>()
  let views = 40
  return {
    requests,
    async install(context: BrowserContext, unavailable = false) {
      // Test-only HTTP fixture; no simulated counters are bundled into the app.
      await context.route('**/api/visits', async route => {
        const request = route.request()
        if (request.method() === 'POST') {
          const payload = request.postDataJSON() as Payload
          requests.push(payload)
          if (!unavailable && !events.has(payload.eventId)) { events.add(payload.eventId); visitors.add(payload.visitorId); views++ }
        }
        await route.fulfill({ status: unavailable ? 503 : 200, contentType: 'application/json', body: JSON.stringify(unavailable
          ? { available: false, reason: 'temporarily_unavailable' }
          : { available: true, views, uniqueVisitors: 25 + visitors.size, estimated: true, consentOnly: true, updatedAt: new Date().toISOString() }) })
      })
    },
  }
}
async function open(page: Page) { await page.goto('/'); await expect(page.getByRole('heading', { level: 1 })).toContainText('Pedro Paulo') }
async function permit(page: Page) { await page.getByRole('complementary', { name: 'Preferências de privacidade' }).getByRole('button', { name: 'Permitir', exact: true }).click() }
async function browserData(page: Page) { return page.evaluate(key => JSON.parse(localStorage.getItem(key) || 'null'), keys.browser) }
async function consent(context: BrowserContext) {
  await context.addInitScript(key => { if (!localStorage.getItem(key)) localStorage.setItem(key, JSON.stringify({ choice: 'accepted', at: Date.now() })) }, keys.consent)
}

test('first visit waits for consent; reload counts a view, not a session or another welcome', async ({ page, context }) => {
  const api = backend(); await api.install(context)
  await open(page)
  await expect(page.getByRole('heading', { name: 'Olá, seja bem-vindo! 👋', exact: true })).toBeVisible()
  expect(api.requests).toHaveLength(0)
  expect(await browserData(page)).toBeNull()
  await permit(page)
  await expect.poll(() => api.requests.length).toBe(1)
  const first = await browserData(page)
  expect(first.views).toBe(1); expect(first.sessions).toBe(1)
  expect(api.requests[0].visitorId).toBe(first.id)
  await page.reload()
  await expect.poll(() => api.requests.length).toBe(2)
  const second = await browserData(page)
  expect(second.id).toBe(first.id); expect(second.views).toBe(2); expect(second.sessions).toBe(1)
  await page.waitForTimeout(1600)
  await expect(page.getByRole('complementary', { name: 'Boas-vindas', exact: true })).toHaveCount(0)
  await page.evaluate(() => { location.hash = '#projetos' })
  await page.waitForTimeout(200)
  expect(api.requests).toHaveLength(2)
  expect(api.requests[0].eventId).not.toBe(api.requests[1].eventId)
})

test('a new tab session recognizes the browser and increments sessions only once', async ({ browser }) => {
  const context = await browser.newContext()
  try {
    const api = backend(); await api.install(context)
    const first = await context.newPage(); await open(first); await permit(first)
    await expect.poll(() => api.requests.length).toBe(1)
    const record = await browserData(first)
    await first.close()
    const returned = await context.newPage(); await open(returned)
    await expect(returned.getByRole('heading', { name: 'Que bom ter você de volta! 👋', exact: true })).toBeVisible()
    await expect.poll(() => api.requests.length).toBe(2)
    const next = await browserData(returned)
    expect(next.id).toBe(record.id); expect(next.sessions).toBe(2); expect(next.views).toBe(2)
    await expect(returned.locator('.portfolio-browser-stats')).toContainText('Visita anterior:')
  } finally { await context.close() }
})

test('simultaneous tabs share one browser ID without losing local increments', async ({ context }) => {
  const api = backend(); await api.install(context); await consent(context)
  const [left, right] = await Promise.all([context.newPage(), context.newPage()])
  await Promise.all([open(left), open(right)])
  await expect.poll(() => api.requests.length).toBe(2)
  expect(api.requests[0].visitorId).toBe(api.requests[1].visitorId)
  const record = await browserData(left)
  expect(record.views).toBe(2); expect(record.sessions).toBe(2)
  await left.reload()
  await expect.poll(() => api.requests.length).toBe(3)
  expect((await browserData(left)).sessions).toBe(2)
})

test('another browser receives a different identifier and the first welcome', async ({ browser }) => {
  const api = backend()
  const contexts = await Promise.all([browser.newContext(), browser.newContext()])
  try {
    for (const context of contexts) {
      await api.install(context)
      const page = await context.newPage(); await open(page); await permit(page)
      await expect(page.getByRole('heading', { name: 'Olá, seja bem-vindo! 👋', exact: true })).toBeVisible()
    }
    expect(api.requests).toHaveLength(2)
    expect(api.requests[0].visitorId).not.toBe(api.requests[1].visitorId)
  } finally { await Promise.all(contexts.map(context => context.close())) }
})

test('API failure keeps welcome usable and retries the same event without invented numbers', async ({ context, page }) => {
  const api = backend(); await api.install(context, true)
  await open(page); await permit(page)
  await expect(page.getByRole('heading', { name: 'Olá, seja bem-vindo! 👋', exact: true })).toBeVisible()
  await expect.poll(() => api.requests.length).toBe(2)
  expect(api.requests[0].eventId).toBe(api.requests[1].eventId)
  await expect(page.locator('.portfolio-stats-unavailable')).toContainText('Estatísticas indisponíveis')
  await expect(page.locator('.portfolio-stats-values')).toHaveCount(0)
})

test('blocked storage degrades to a generic welcome and public read-only stats', async ({ context, page }) => {
  const api = backend(); await api.install(context)
  const errors: string[] = []; page.on('pageerror', error => errors.push(error.message))
  await context.addInitScript(() => {
    for (const key of ['localStorage', 'sessionStorage']) Object.defineProperty(window, key, { get() { throw new DOMException('Blocked', 'SecurityError') } })
  })
  await open(page)
  await expect(page.getByRole('heading', { name: 'Olá, seja bem-vindo! 👋', exact: true })).toBeVisible()
  await expect(page.getByText('Armazenamento bloqueado: reconhecimento e medição desativados.')).toBeAttached()
  expect(api.requests).toHaveLength(0); expect(errors).toEqual([])
})

test('decline and revocation erase recognition and prevent later writes across tabs', async ({ context, page }) => {
  const api = backend(); await api.install(context)
  await open(page); await permit(page)
  await expect.poll(() => api.requests.length).toBe(1)
  const other = await context.newPage(); await open(other)
  await expect.poll(() => api.requests.length).toBe(2)
  await page.getByRole('button', { name: 'Gerenciar autorização' }).click()
  await page.getByRole('button', { name: 'Revogar autorização' }).click()
  expect(await browserData(page)).toBeNull()
  await expect.poll(() => browserData(other)).toBeNull()
  await other.reload(); await other.waitForTimeout(1600)
  expect(api.requests).toHaveLength(2)
  await expect(other.getByRole('button', { name: 'Preferências de visitas', exact: true })).toBeAttached()
})

test('toast pauses for hover and focus, then closes manually without stealing focus', async ({ context, page }) => {
  const api = backend(); await api.install(context)
  await open(page)
  const toast = page.getByRole('complementary', { name: 'Boas-vindas', exact: true })
  await expect(toast).toBeVisible()
  await toast.hover()
  await expect(toast).toHaveAttribute('data-paused', 'true')
  await page.waitForTimeout(6200)
  await expect(toast).toBeVisible()
  const close = toast.getByRole('button', { name: 'Fechar boas-vindas' })
  await close.focus(); await page.mouse.move(1, 1)
  await expect(toast).toHaveAttribute('data-paused', 'true')
  await page.keyboard.press('Escape')
  await expect(toast).toHaveCount(0)
})

test('toast closes after its duration when not hovered or focused', async ({ context, page }) => {
  const api = backend(); await api.install(context)
  await page.mouse.move(1, 1); await open(page)
  const toast = page.getByRole('complementary', { name: 'Boas-vindas', exact: true })
  await expect(toast).toBeVisible()
  await expect(toast).toHaveCount(0, { timeout: 8500 })
})

for (const width of [320, 375, 768, 1024, 1440]) {
  test(`welcome and public footer fit at ${width}px with reduced motion`, async ({ context, page }) => {
    const api = backend(); await api.install(context)
    await page.emulateMedia({ reducedMotion: 'reduce' }); await page.setViewportSize({ width, height: 900 })
    await open(page)
    const toast = page.getByRole('complementary', { name: 'Boas-vindas', exact: true })
    await expect(toast).toBeVisible()
    const bounds = (await toast.boundingBox())!
    const header = (await page.locator('.site-header').boundingBox())!
    expect(bounds.x).toBeGreaterThanOrEqual(0)
    expect(bounds.x + bounds.width).toBeLessThanOrEqual(width)
    expect(bounds.y).toBeGreaterThanOrEqual(header.y + header.height)
    expect(await toast.evaluate(element => getComputedStyle(element).transform)).toBe('none')
    await expect(toast.locator('.welcome-toast-progress')).toBeHidden()
    await toast.screenshot({ path: `artifacts/visits/welcome-${width}.png` })
    await toast.getByRole('button', { name: 'Fechar boas-vindas' }).click()
    await permit(page)
    await expect.poll(() => api.requests.length).toBe(1)
    await page.locator('.portfolio-stats').scrollIntoViewIfNeeded()
    await expect(page.locator('.portfolio-stats-values')).toBeVisible()
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
    await page.locator('.site-footer').screenshot({ path: `artifacts/visits/footer-${width}.png` })
  })
}
