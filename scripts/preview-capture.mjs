import { chromium } from '@playwright/test'
import { mkdir } from 'node:fs/promises'
import { resolve } from 'node:path'
import { pathToFileURL } from 'node:url'

const browser = await chromium.launch({ channel: 'chrome', headless: true })
const page = await browser.newPage({ viewport: { width: 1440, height: 1050 }, deviceScaleFactor: 1, reducedMotion: 'reduce' })
await mkdir('artifacts', { recursive: true })
await page.goto('http://127.0.0.1:5173/', { waitUntil: 'networkidle' })
await page.screenshot({ path: 'artifacts/desktop.png' })
for (const id of ['sobre', 'projetos', 'demonstracao', 'competencias', 'contato']) {
  await page.locator(`#${id}`).scrollIntoViewIfNeeded()
  await page.waitForTimeout(80)
}
await page.screenshot({ path: 'artifacts/full-desktop.png', fullPage: true })
await page.setViewportSize({ width: 390, height: 844 })
await page.goto('http://127.0.0.1:5173/', { waitUntil: 'networkidle' })
await page.screenshot({ path: 'artifacts/mobile.png' })
await page.setViewportSize({ width: 1200, height: 630 })
await page.goto(pathToFileURL(resolve('public/og-image.svg')).href)
await page.screenshot({ path: 'public/og-image.png' })
await browser.close()
console.log('Screenshots and Open Graph image generated.')
