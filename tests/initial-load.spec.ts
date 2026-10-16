import { expect, test } from '@playwright/test'

for (const width of [390, 1440]) {
for (const path of ['/', '/recrutador', '/projetos/reading-keepedu']) {
  test(`production cold load never reveals the SEO fallback at ${width}px: ${path}`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 })
    await page.route('**/api/visits', route => route.fulfill({ json: { available: false } }))
    await page.addInitScript(() => {
      const samples: string[] = []
      ;(window as unknown as { fallbackFlashes: string[] }).fallbackFlashes = samples
      // The SEO fallback is a direct main child; the app mounts a wrapper instead.
      new MutationObserver(() => {
        const root = document.getElementById('root')
        const fallback = root?.querySelector(':scope > main')
        if (fallback && getComputedStyle(fallback).visibility !== 'hidden') samples.push(fallback.textContent ?? '')
      }).observe(document, { subtree: true, childList: true, attributes: true, attributeFilter: ['data-prerender'] })
    })
    let release!: () => void
    const blocked = new Promise<void>(resolve => { release = resolve })
    await page.route('**/assets/*.js', async route => { await blocked; await route.continue() })
    await page.goto(path, { waitUntil: 'commit' })
    const fallback = page.locator('#root[data-prerender] > main')
    await expect(fallback).toBeAttached()
    await expect(fallback).toBeHidden()
    // Allow multiple paints with a cold, delayed JS response.
    await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))))
    release()
    await expect(page.locator('.site-header')).toBeVisible()
    await expect(page.locator('#root')).not.toHaveAttribute('data-prerender')
    await expect(page.locator('#root > main')).toHaveCount(0)
    expect(await page.evaluate(() => (window as unknown as { fallbackFlashes: string[] }).fallbackFlashes)).toEqual([])
  })
}
}

test('SEO content stays readable without JavaScript', async ({ browser, baseURL }) => {
  const context = await browser.newContext({ javaScriptEnabled: false, baseURL })
  const page = await context.newPage()
  await page.goto('/')
  await expect(page.locator('#root[data-prerender] > main')).toBeVisible()
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Pedro Paulo')
  await context.close()
})
