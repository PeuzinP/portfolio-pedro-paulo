import { chromium, expect } from '@playwright/test'
import { mkdir, writeFile } from 'node:fs/promises'

// Start Vite first: npm run dev. Optional: AVATAR_BASE_URL=http://127.0.0.1:5174
const baseURL = process.env.AVATAR_BASE_URL ?? 'http://127.0.0.1:5173'
const output = 'artifacts/avatar-motion'
const widths = [320, 375, 430, 768, 1024, 1440, 1920]
const report = { viewports: [], motion: {}, errors: [] }
const browser = await chromium.launch({ channel: 'chrome', headless: true })

function monitor(page) {
  page.on('pageerror', error => report.errors.push(error.message))
  page.on('console', message => {
    if (message.type() === 'error') report.errors.push(message.text())
  })
}

try {
  await mkdir(output, { recursive: true })
  const layoutPage = await browser.newPage({ reducedMotion: 'reduce', deviceScaleFactor: 1 })
  monitor(layoutPage)
  for (const width of widths) {
    await layoutPage.setViewportSize({ width, height: 1000 })
    await layoutPage.goto(baseURL, { waitUntil: 'networkidle' })
    await layoutPage.addStyleTag({ content: 'html { scroll-behavior: auto !important; }' })
    const avatar = layoutPage.locator('figure.pixel-avatar')
    await avatar.scrollIntoViewIfNeeded()
    await expect(avatar).toHaveAttribute('data-phase', 'ready')
    await layoutPage.locator('#sobre').screenshot({ path: `${output}/about-${width}.png`, style: '.site-header, .skip-link { visibility: hidden !important; }' })
    const dimensions = await avatar.evaluate(element => {
      const bounds = element.getBoundingClientRect()
      const column = element.parentElement.getBoundingClientRect()
      const image = element.querySelector('.pixel-avatar-image')
      return {
        viewport: innerWidth,
        avatarWidth: Math.round(bounds.width * 100) / 100,
        columnWidth: Math.round(column.width * 100) / 100,
        gapAfterSignature: Math.round(bounds.top - element.previousElementSibling.getBoundingClientRect().bottom),
        afterSignature: element.previousElementSibling.classList.contains('about-signature'),
        imageLoaded: image.complete && image.naturalWidth > 0,
        imageSize: `${image.naturalWidth}×${image.naturalHeight}`,
        pixelated: getComputedStyle(image).imageRendering === 'pixelated',
        overflow: Math.max(document.documentElement.scrollWidth, document.body.scrollWidth) > document.documentElement.clientWidth + 1,
      }
    })
    report.viewports.push(dimensions)
  }
  await layoutPage.close()

  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 }, reducedMotion: 'no-preference', deviceScaleFactor: 1 })
  monitor(page)
  await page.goto(baseURL, { waitUntil: 'networkidle' })
  await page.addStyleTag({ content: 'html { scroll-behavior: auto !important; }' })
  const avatar = page.locator('figure.pixel-avatar')
  await avatar.scrollIntoViewIfNeeded()
  await expect(avatar).toHaveAttribute('data-phase', 'assembling')
  // Screenshots preserve ongoing animations, including actual canvas fragments.
  for (const [name, delay] of [['01-seeding', 200], ['02-fragments', 550], ['03-materializing', 650]]) {
    await page.waitForTimeout(delay)
    await avatar.screenshot({ path: `${output}/${name}.png`, animations: 'allow' })
  }
  await expect(avatar).toHaveAttribute('data-phase', 'ready', { timeout: 6000 })
  await page.waitForTimeout(450)
  await avatar.screenshot({ path: `${output}/04-ready.png`, animations: 'allow' })
  const bounds = await avatar.boundingBox()
  await page.mouse.move(bounds.x + bounds.width * .85, bounds.y + bounds.height * .2)
  await page.waitForTimeout(500)
  await avatar.screenshot({ path: `${output}/05-hover.png`, animations: 'allow' })
  report.motion.hoverTransform = await avatar.locator('.pixel-avatar-scene').evaluate(element => getComputedStyle(element).transform)
  report.motion.hoverTerminal = await avatar.locator('.pixel-avatar-terminal').innerText()
  await page.mouse.move(5, 5)
  await page.waitForTimeout(1500)
  report.motion.restTransform = await avatar.locator('.pixel-avatar-scene').evaluate(element => getComputedStyle(element).transform)
  await page.locator('#inicio').scrollIntoViewIfNeeded()
  await expect(avatar).toHaveAttribute('data-active', 'false')
  const canvas = avatar.locator('canvas.pixel-avatar-canvas')
  const pausedFrame = await canvas.evaluate(element => element.toDataURL())
  await page.waitForTimeout(300)
  report.motion.canvasPausedOffscreen = pausedFrame === await canvas.evaluate(element => element.toDataURL())
  await avatar.scrollIntoViewIfNeeded()
  report.motion.phaseAfterReentry = await avatar.getAttribute('data-phase')
  await page.close()

  const touch = await browser.newPage({ viewport: { width: 375, height: 844 }, isMobile: true, hasTouch: true, reducedMotion: 'no-preference' })
  monitor(touch)
  await touch.goto(baseURL, { waitUntil: 'networkidle' })
  const touchAvatar = touch.locator('figure.pixel-avatar')
  await touchAvatar.scrollIntoViewIfNeeded()
  await expect(touchAvatar).toHaveAttribute('data-phase', 'ready', { timeout: 6000 })
  await touchAvatar.tap()
  report.motion.touchInteractive = await touchAvatar.getAttribute('data-interactive')
  await touchAvatar.screenshot({ path: `${output}/06-touch.png`, animations: 'allow' })
  await touch.close()

  await writeFile(`${output}/report.json`, `${JSON.stringify(report, null, 2)}\n`)
  console.log(JSON.stringify(report, null, 2))
  if (report.errors.length || report.viewports.some(item => item.overflow || !item.imageLoaded || !item.afterSignature || !item.pixelated) || !report.motion.canvasPausedOffscreen || report.motion.phaseAfterReentry !== 'ready' || report.motion.touchInteractive !== 'false') {
    throw new Error(`Avatar validation failed; see ${output}/report.json`)
  }
} finally {
  await browser.close()
}
