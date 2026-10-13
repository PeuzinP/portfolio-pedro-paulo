import { expect, test as base } from '@playwright/test'
import type { Locator, Page } from '@playwright/test'

const test = base.extend<{ errorMonitor: void }>({
  errorMonitor: [async ({ page }, use) => {
    const errors: string[] = []
    page.on('pageerror', error => errors.push(error.message))
    page.on('console', message => {
      if (message.type() === 'error') errors.push(message.text())
    })
    await use()
    expect(errors, 'Avatar rendering should not cause browser errors').toEqual([])
  }, { auto: true }],
})

async function openAvatar(page: Page) {
  await page.goto('/')
  await page.addStyleTag({ content: 'html { scroll-behavior: auto !important; }' })
  const avatar = page.locator('figure.pixel-avatar')
  await avatar.scrollIntoViewIfNeeded()
  return avatar
}

async function canvasSnapshot(avatar: Locator) {
  return avatar.locator('canvas.pixel-avatar-canvas').evaluate((canvas: HTMLCanvasElement) => canvas.toDataURL())
}

async function sceneMotion(avatar: Locator) {
  return avatar.locator('.pixel-avatar-scene').evaluate(element => {
    const matrix = new DOMMatrixReadOnly(getComputedStyle(element).transform)
    return Math.max(Math.abs(matrix.m13), Math.abs(matrix.m23), Math.abs(matrix.m31), Math.abs(matrix.m32), Math.abs(matrix.m41), Math.abs(matrix.m42))
  })
}

test.describe('avatar layout and reduced motion', () => {
  test.use({ contextOptions: { reducedMotion: 'reduce' } })

  for (const width of [320, 375, 430, 768, 1024, 1440, 1920]) {
    test(`preserves the about hierarchy and fits at ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 1000 })
      const avatar = await openAvatar(page)
      await expect(avatar).toHaveAttribute('data-phase', 'ready')
      await expect(avatar.locator('.pixel-avatar-image')).toBeVisible()
      const layout = await avatar.evaluate(element => {
        const avatarBounds = element.getBoundingClientRect()
        const signature = element.previousElementSibling!
        const signatureBounds = signature.getBoundingClientRect()
        const column = element.parentElement!.getBoundingClientRect()
        const story = document.querySelector('.about-story')!.getBoundingClientRect()
        const image = element.querySelector<HTMLImageElement>('.pixel-avatar-image')!
        const imageBounds = image.getBoundingClientRect()
        return {
          width: avatarBounds.width,
          columnWidth: column.width,
          gap: avatarBounds.top - signatureBounds.bottom,
          afterSignature: signature.classList.contains('about-signature'),
          insideLeft: element.parentElement === document.querySelector('.about-grid')!.firstElementChild,
          fitsColumn: avatarBounds.left >= column.left - 1 && avatarBounds.right <= column.right + 1,
          fitsViewport: avatarBounds.left >= -1 && avatarBounds.right <= innerWidth + 1,
          storyCollision: story.left > column.left + 20 && avatarBounds.right > story.left,
          naturalRatio: image.naturalWidth / image.naturalHeight,
          renderedRatio: imageBounds.width / imageBounds.height,
          rendering: getComputedStyle(image).imageRendering,
          overflow: Math.max(document.documentElement.scrollWidth, document.body.scrollWidth) - document.documentElement.clientWidth,
        }
      })
      expect(layout.afterSignature).toBe(true)
      expect(layout.insideLeft).toBe(true)
      expect(layout.fitsColumn).toBe(true)
      expect(layout.fitsViewport).toBe(true)
      expect(layout.storyCollision).toBe(false)
      expect(layout.gap).toBeGreaterThanOrEqual(20)
      expect(layout.gap).toBeLessThanOrEqual(64)
      expect(layout.overflow).toBeLessThanOrEqual(1)
      const range = width < 768 ? [260, 320] : width < 1200 ? [300, 380] : [380, 460]
      expect(layout.width).toBeGreaterThanOrEqual(Math.min(range[0], layout.columnWidth) - 1)
      expect(layout.width).toBeLessThanOrEqual(range[1] + 1)
      expect(layout.renderedRatio).toBeCloseTo(layout.naturalRatio, 2)
      expect(layout.rendering).toBe('pixelated')
      await expect(avatar.locator('.pixel-avatar-terminal')).toBeVisible()
    })
  }

  test('shows a static complete portrait immediately with reduced motion', async ({ page }) => {
    const avatar = await openAvatar(page)
    await expect(avatar).toHaveAttribute('data-phase', 'ready')
    await expect(avatar).toHaveAttribute('data-interactive', 'false')
    const before = await canvasSnapshot(avatar)
    await avatar.hover()
    await page.waitForTimeout(400)
    expect(await canvasSnapshot(avatar)).toBe(before)
    expect(await sceneMotion(avatar)).toBeLessThan(.01)
    const activeAnimations = await avatar.evaluate(element => element.getAnimations({ subtree: true }).filter(animation => animation.playState === 'running').length)
    expect(activeAnimations, 'Reduced motion should also stop decorative CSS animation').toBe(0)
  })
})

test.describe('avatar motion', () => {
  test.use({ contextOptions: { reducedMotion: 'no-preference' }, viewport: { width: 1440, height: 1000 } })

  test('reconstructs image fragments, then reveals the original portrait and runs only once', async ({ page }) => {
    await page.goto('/')
    await page.addStyleTag({ content: 'html { scroll-behavior: auto !important; }' })
    const avatar = page.locator('figure.pixel-avatar')
    await expect(avatar).toHaveAttribute('data-phase', 'waiting')
    await avatar.scrollIntoViewIfNeeded()
    await expect(avatar).toHaveAttribute('data-phase', 'assembling')
    const started = Date.now()
    await expect(avatar.locator('.pixel-avatar-terminal')).not.toBeVisible()
    // Warm portrait colors distinguish image fragments from cyan decorative particles.
    await expect.poll(async () => avatar.locator('canvas.pixel-avatar-canvas').evaluate((canvas: HTMLCanvasElement) => {
      const pixels = canvas.getContext('2d')!.getImageData(0, 0, canvas.width, canvas.height).data
      let portraitPixels = 0
      for (let index = 0; index < pixels.length; index += 16) {
        if (pixels[index + 3] > 80 && pixels[index] > 100 && pixels[index] > pixels[index + 1] * 1.2 && pixels[index + 1] > pixels[index + 2] * 1.1) portraitPixels++
      }
      return portraitPixels
    }), { timeout: 1900, intervals: [100] }).toBeGreaterThan(100)
    await expect(avatar).toHaveAttribute('data-phase', 'ready', { timeout: 5000 })
    expect(Date.now() - started).toBeGreaterThan(1500)
    await expect(avatar.locator('.pixel-avatar-image')).toBeVisible()
    await expect(avatar.locator('.pixel-avatar-terminal')).toBeVisible()
    expect(await avatar.locator('.pixel-avatar-image').evaluate((image: HTMLImageElement) => image.complete && image.naturalWidth > 0 && getComputedStyle(image).opacity === '1')).toBe(true)
    await page.locator('#inicio').scrollIntoViewIfNeeded()
    await expect(avatar).toHaveAttribute('data-active', 'false')
    await avatar.scrollIntoViewIfNeeded()
    await expect(avatar).toHaveAttribute('data-active', 'true')
    await expect(avatar).toHaveAttribute('data-phase', 'ready')
  })

  test('pauses canvas work outside the viewport and resumes without replaying the entrance', async ({ page }) => {
    const avatar = await openAvatar(page)
    await expect(avatar).toHaveAttribute('data-phase', 'ready', { timeout: 6000 })
    const activeFrame = await canvasSnapshot(avatar)
    await page.waitForTimeout(160)
    expect(await canvasSnapshot(avatar)).not.toBe(activeFrame)
    await page.locator('#inicio').scrollIntoViewIfNeeded()
    await expect(avatar).toHaveAttribute('data-active', 'false')
    const pausedFrame = await canvasSnapshot(avatar)
    await page.waitForTimeout(300)
    expect(await canvasSnapshot(avatar)).toBe(pausedFrame)
    await avatar.scrollIntoViewIfNeeded()
    await expect(avatar).toHaveAttribute('data-active', 'true')
    await expect(avatar).toHaveAttribute('data-phase', 'ready')
    await expect.poll(() => canvasSnapshot(avatar)).not.toBe(pausedFrame)
  })

  test('responds to page visibility changes by stopping canvas work', async ({ page }) => {
    const avatar = await openAvatar(page)
    await expect(avatar).toHaveAttribute('data-phase', 'ready', { timeout: 6000 })
    // Headless windows do not consistently background tabs; exercise Page Visibility deterministically.
    await page.evaluate(() => {
      Object.defineProperty(document, 'hidden', { configurable: true, get: () => true })
      Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => 'hidden' })
      document.dispatchEvent(new Event('visibilitychange'))
    })
    await expect(avatar).toHaveAttribute('data-active', 'false')
    const frame = await canvasSnapshot(avatar)
    await page.waitForTimeout(300)
    expect(await canvasSnapshot(avatar)).toBe(frame)
    await page.evaluate(() => {
      Reflect.deleteProperty(document, 'hidden')
      Reflect.deleteProperty(document, 'visibilityState')
      document.dispatchEvent(new Event('visibilitychange'))
    })
    await expect(avatar).toHaveAttribute('data-active', 'true')
    await expect.poll(() => canvasSnapshot(avatar)).not.toBe(frame)
  })

  test('applies changed motion preferences during assembly without replaying afterward', async ({ page }) => {
    const avatar = await openAvatar(page)
    await expect(avatar).toHaveAttribute('data-phase', 'assembling')
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await expect(avatar).toHaveAttribute('data-phase', 'ready')
    await expect(avatar).toHaveAttribute('data-reduced', 'true')
    await expect(avatar).toHaveAttribute('data-interactive', 'false')
    await expect(avatar.locator('.pixel-avatar-image')).toBeVisible()
    const frame = await canvasSnapshot(avatar)
    await page.waitForTimeout(250)
    expect(await canvasSnapshot(avatar)).toBe(frame)
    expect(await sceneMotion(avatar)).toBeLessThan(.01)
    await page.emulateMedia({ reducedMotion: 'no-preference' })
    await expect(avatar).toHaveAttribute('data-reduced', 'false')
    await expect(avatar).toHaveAttribute('data-phase', 'ready')
    await expect.poll(() => canvasSnapshot(avatar)).not.toBe(frame)
  })

  test('uses subtle cursor depth and returns smoothly to rest after pointer exit', async ({ page }) => {
    const avatar = await openAvatar(page)
    await expect(avatar).toHaveAttribute('data-phase', 'ready', { timeout: 6000 })
    await expect(avatar).toHaveAttribute('data-interactive', 'true')
    const bounds = (await avatar.boundingBox())!
    await page.mouse.move(bounds.x + bounds.width * .85, bounds.y + bounds.height * .2)
    await expect.poll(() => sceneMotion(avatar)).toBeGreaterThan(.015)
    await expect(avatar.locator('.pixel-avatar-terminal')).toContainText('sistemas conectados')
    await expect(avatar.locator('.terminal-hover')).toHaveCSS('opacity', '1')
    await expect(avatar.locator('.terminal-default')).toHaveCSS('opacity', '0')
    await page.mouse.move(5, 5)
    await expect.poll(() => sceneMotion(avatar), { timeout: 3000 }).toBeLessThan(.01)
    await expect(avatar.locator('.pixel-avatar-terminal')).toContainText('pedro.paulo')
    await expect(avatar.locator('.terminal-default')).toHaveCSS('opacity', '1')
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true)
  })
})

test.describe('touch avatar', () => {
  test.use({ viewport: { width: 375, height: 844 }, isMobile: true, hasTouch: true, contextOptions: { reducedMotion: 'no-preference' } })

  test('keeps passive ambient motion without sticky hover or tilt', async ({ page }) => {
    const avatar = await openAvatar(page)
    await expect(avatar).toHaveAttribute('data-phase', 'ready', { timeout: 6000 })
    await expect(avatar).toHaveAttribute('data-interactive', 'false')
    await avatar.tap()
    expect(await sceneMotion(avatar)).toBeLessThan(.01)
    await expect(avatar.locator('.pixel-avatar-terminal')).toContainText('pedro.paulo')
    await expect(avatar.locator('.terminal-hover')).toHaveCSS('opacity', '0')
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true)
  })
})
