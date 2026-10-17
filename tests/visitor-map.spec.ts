import { expect, test } from '@playwright/test'
const stats = { available:true, views:100, uniqueVisitors:45, estimated:true, consentOnly:true, period:'all', countries:[{code:'BR',views:60},{code:'US',views:30}], unknownViews:10, updatedAt:'2026-10-16T12:00:00Z' }
async function setup(page: import('@playwright/test').Page, data = stats) {
  await page.route('**/api/visits', r => r.fulfill({json:data}))
  await page.goto('/')
  await page.getByRole('button', {name:'Agora não',exact:true}).click()
  await page.getByRole('button', {name:'Fechar boas-vindas',exact:true}).click()
  await page.getByRole('heading',{name:'De onde vêm os visitantes'}).scrollIntoViewIfNeeded()
  await expect(page.locator('[data-country="BR"]')).toBeVisible()
}
test('map tooltip, ranking, keyboard zoom, pan, reset and consistent totals', async ({page}) => {
 await setup(page)
 const br=page.locator('[data-country="BR"]')
 await br.hover()
 await expect(page.locator('.visitor-tooltip')).toContainText('60 visualizações · 60%')
 await page.locator('.visitor-ranking').getByRole('button',{name:'Brasil 60'}).click()
 await expect(br).toHaveAttribute('aria-pressed','true')
 await expect(page.locator('.visitor-detail')).toContainText('60 visualizações')
 const svg=page.locator('.visitor-map-stage svg')
 await expect.poll(async()=>Number((await svg.getAttribute('viewBox'))?.split(' ')[2])).toBeLessThan(360)
 await br.focus(); await page.keyboard.press('ArrowRight')
 await page.getByRole('button',{name:'Limpar seleção'}).click()
 await expect(br).toHaveAttribute('aria-pressed','false')
 await expect(svg).toHaveAttribute('viewBox','0 0 360 180')
 await br.focus(); await page.keyboard.press('Enter')
 await expect(br).toHaveAttribute('aria-pressed','true')
 await page.keyboard.press('Escape')
 await expect(svg).toHaveAttribute('viewBox','0 0 360 180')
 await expect(page.locator('.visitor-sidebar')).toContainText('Localização não identificada: 10')
 await page.locator('.visitor-section').screenshot({path:'artifacts/visitor-map-desktop.png'})
})
test('mobile touch selection, dragging, controls and no horizontal overflow', async ({browser}) => {
 const context=await browser.newContext({viewport:{width:375,height:812},hasTouch:true,isMobile:true,reducedMotion:'reduce'})
 const page=await context.newPage(); await setup(page)
 await page.locator('.visitor-ranking').getByRole('button',{name:'Brasil 60'}).tap()
 await expect(page.locator('[data-country="BR"]')).toHaveAttribute('aria-pressed','true')
 const svg=page.locator('.visitor-map-stage svg'); await svg.scrollIntoViewIfNeeded(); const before=await svg.getAttribute('viewBox')
 const box=(await svg.boundingBox())!
 const touch=await context.newCDPSession(page)
 const x=box.x+box.width/2,y=box.y+box.height/2
 // A timed browser gesture avoids an instantaneous synthetic fling suppressing
 // the next tap; the application still receives the normal touch/pointer events.
 await touch.send('Input.synthesizeScrollGesture',{x,y,xDistance:-30,yDistance:-20,speed:300,gestureSourceType:'touch',preventFling:true})
 await touch.detach()
 await expect(svg).not.toHaveAttribute('viewBox',before!)
 await page.getByRole('button',{name:'Visão mundial'}).tap(); await expect(svg).toHaveAttribute('viewBox','0 0 360 180')
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true)
 await page.locator('.visitor-section').screenshot({path:'artifacts/visitor-map-mobile.png'})
 await context.close()
})
test('empty data and geometry retry', async ({page}) => {
 let fail=true
 await page.route('**/geo/countries.json',async route=>{if(fail) await route.fulfill({status:503}); else await route.continue()})
 await page.route('**/api/visits',r=>r.fulfill({json:{...stats,views:0,uniqueVisitors:0,countries:[],unknownViews:0}}))
 await page.goto('/'); await page.getByRole('button',{name:'Agora não',exact:true}).click()
 await page.getByRole('heading',{name:'De onde vêm os visitantes'}).scrollIntoViewIfNeeded()
 await expect(page.getByRole('alert')).toContainText('Não foi possível carregar o mapa')
 fail=false; await page.getByRole('alert').getByRole('button').click()
 await expect(page.locator('[data-country="BR"]')).toBeVisible()
 await expect(page.locator('.visitor-sidebar')).toContainText('Aguardando os primeiros acessos autorizados')
})
test('PDF opens in a new tab and preserves portfolio',async({page,context})=>{
 await setup(page)
 const link=page.getByRole('link',{name:'Currículo (abre em nova aba)',exact:true})
 await expect(link).toHaveAttribute('href','/curriculo-pedro-paulo.pdf')
 await expect(link).toHaveAttribute('target','_blank'); await expect(link).toHaveAttribute('rel','noopener noreferrer')
 expect(await link.getAttribute('download')).toBeNull()
 const original=page.url(); const popup=context.waitForEvent('page'); await link.click(); const pdf=await popup
 await pdf.waitForLoadState(); expect(pdf.url()).toContain('/curriculo-pedro-paulo.pdf'); expect(page.url()).toBe(original)
})

test('Brazil hover identifies the correct state and synchronizes real state totals, keyboard and selection', async ({page}) => {
  let stateRequests=0
  await page.route('**/geo/brazil-states.json',async route=>{stateRequests++;await route.continue()})
  await setup(page,{...stats,brazilStates:[{code:'MG',views:20},{code:'SP',views:10}],unknownBrazilStateViews:30} as typeof stats)
  expect(stateRequests).toBe(0)
  await page.getByRole('button',{name:'Explorar estados do Brasil',exact:true}).click()
  const mg=page.locator('[data-state="MG"]')
  await expect(mg).toBeVisible()
  expect(await page.locator('[data-state]').count()).toBe(27)
  // Belo Horizonte: use the map's real projection, rather than a bounding box approximation.
  const svg=page.locator('.visitor-map-stage svg')
  await expect.poll(async()=>Number((await svg.getAttribute('viewBox'))?.split(' ')[2])).toBeLessThan(150)
  await page.waitForTimeout(400)
  await svg.scrollIntoViewIfNeeded()
  const point=await svg.evaluate(element=>{const svg=element as SVGSVGElement;const matrix=svg.getScreenCTM()!;const point=new DOMPoint(180-43.94,90+19.92).matrixTransform(matrix);return{x:point.x,y:point.y}})
  await page.mouse.move(point.x,point.y)
  await expect(page.locator('.visitor-tooltip')).toContainText('Minas Gerais (MG) · Brasil · 20 visualizações · 33,3% dos acessos do Brasil')
  await expect(page.locator('.visitor-state-tooltip')).toHaveText('Minas Gerais (MG)')
  await page.mouse.click(point.x,point.y)
  await expect(mg).toHaveAttribute('aria-pressed','true')
  await expect(page.locator('.visitor-detail h4')).toHaveText('Minas Gerais (MG)')
  await expect(page.locator('.visitor-states-panel')).toContainText('Estado não identificado: 30')
  await page.getByLabel('Explorar um estado',{exact:true}).selectOption('DF')
  await expect(page.locator('.visitor-detail')).toContainText('Distrito Federal (DF)')
  await page.getByRole('button',{name:'Ver todo o Brasil',exact:true}).click()
  const sp=page.locator('[data-state="SP"]');await sp.focus();await page.keyboard.press('Enter')
  await expect(sp).toHaveAttribute('aria-pressed','true')
  await page.keyboard.press('Escape');await expect(page.locator('[data-state]')).toHaveCount(0)
  await expect(svg).toHaveAttribute('viewBox','0 0 360 180')
})

test('states support mobile touch and old analytics without invented counts',async({browser})=>{
 const context=await browser.newContext({viewport:{width:375,height:812},hasTouch:true,isMobile:true,reducedMotion:'reduce'})
 const page=await context.newPage();await setup(page)
 await page.getByRole('button',{name:'Explorar estados do Brasil',exact:true}).tap()
 const mg=page.locator('[data-state="MG"]');await expect(mg).toBeVisible()
 await mg.tap()
 await expect(page.locator('.visitor-detail h4')).toHaveText('Minas Gerais (MG)')
 await expect(page.locator('.visitor-detail')).toContainText('Contagem por estado ainda indisponível')
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true)
 await context.close()
})

test('state geometry failure can retry without hiding the country map',async({page})=>{
 let failed=true
 await page.route('**/geo/brazil-states.json',async route=>{if(failed) await route.fulfill({status:503});else await route.continue()})
 await setup(page)
 await page.getByRole('button',{name:'Explorar estados do Brasil',exact:true}).click()
 await expect(page.getByRole('alert')).toContainText('Não foi possível carregar os estados')
 await expect(page.locator('[data-country="BR"]')).toBeVisible()
 failed=false;await page.getByRole('alert').getByRole('button',{name:'Tentar novamente'}).click()
 await expect(page.locator('[data-state]')).toHaveCount(27)
})

test('map dots and focus borders remain small at state zoom and on resize', async ({page}) => {
  await setup(page)
  const svg = page.locator('.visitor-map-stage svg')
  const dotSpacing = () => page.locator('#visitor-dots').evaluate(element => {
    const pattern = element as SVGPatternElement
    return pattern.width.baseVal.value * pattern.patternTransform.baseVal.consolidate()!.matrix.a * pattern.ownerSVGElement!.getScreenCTM()!.a
  })
  await expect.poll(dotSpacing).toBeCloseTo(4, 1)
  await page.getByRole('button', {name:'Explorar estados do Brasil',exact:true}).click()
  const pi = page.locator('[data-state="PI"]')
  await expect(pi).toBeVisible()
  await pi.focus(); await page.keyboard.press('Enter')
  await expect(pi).toHaveAttribute('aria-pressed','true')
  await expect.poll(async () => Number((await svg.getAttribute('viewBox'))?.split(' ')[2])).toBeLessThan(35)
  await expect.poll(dotSpacing).toBeCloseTo(4, 1)
  expect(await pi.evaluate(element => getComputedStyle(element).stroke)).toBe('none')
  const border = page.locator('[data-state="PI"] + .visitor-state-border')
  await expect(border).toHaveAttribute('vector-effect','non-scaling-stroke')
  expect(await border.evaluate(element => parseFloat(getComputedStyle(element).strokeWidth))).toBeLessThanOrEqual(1.5)
  await page.locator('.visitor-map-column').screenshot({path:'artifacts/brazil-states-piaui-fixed.png'})
  await page.setViewportSize({width:375,height:812})
  await expect.poll(dotSpacing).toBeCloseTo(4, 1)
  await page.getByRole('button',{name:'Visão mundial',exact:true}).click()
  await expect(svg).toHaveAttribute('viewBox','0 0 360 180')
  await expect.poll(dotSpacing).toBeCloseTo(4, 1)
})

test('long state tooltips stay inside the map at narrow and wide widths', async ({page}) => {
  await page.emulateMedia({reducedMotion:'reduce'})
  await setup(page)
  await page.getByRole('button',{name:'Explorar estados do Brasil',exact:true}).click()
  await expect(page.locator('[data-state="RN"]')).toBeVisible()
  const stage = page.locator('.visitor-map-stage')
  const svg = stage.locator('svg')
  for (const width of [360,390,768,1024,1440]) {
    await page.setViewportSize({width,height:900})
    await stage.scrollIntoViewIfNeeded()
    // Natal is near the eastern edge; its long state name previously got clipped.
    const point = await svg.evaluate(element => {
      const matrix=(element as SVGSVGElement).getScreenCTM()!
      const point=new DOMPoint(180-35.21,90+5.80).matrixTransform(matrix)
      return {x:point.x,y:point.y}
    })
    await page.mouse.move(point.x,point.y)
    const tooltip=page.locator('.visitor-state-tooltip')
    await expect(tooltip).toHaveText('Rio Grande do Norte (RN)')
    await expect(tooltip).toBeVisible()
    const mapBox=(await stage.boundingBox())!
    const tipBox=(await tooltip.boundingBox())!
    expect(tipBox.x).toBeGreaterThanOrEqual(mapBox.x)
    expect(tipBox.x+tipBox.width).toBeLessThanOrEqual(mapBox.x+mapBox.width)
    expect(tipBox.y+tipBox.height).toBeLessThanOrEqual(mapBox.y+mapBox.height)
  }
})

test('statistics retry shows loading and recovers with matching map totals', async ({page}) => {
  let attempts=0
  let resume: () => void = () => {}
  const pending = new Promise<void>(resolve => {resume=resolve})
  await page.route('**/api/visits',async route => {
    attempts++
    if (attempts===1) {await route.fulfill({status:503});return}
    await pending
    await route.fulfill({json:stats})
  })
  await page.goto('/')
  await page.getByRole('button',{name:'Agora não',exact:true}).click()
  const section=page.locator('.portfolio-stats')
  await section.getByRole('button',{name:'Tentar novamente',exact:true}).click()
  await expect(section.locator('.portfolio-stats-content')).toHaveAttribute('aria-busy','true')
  await expect(section.locator('.portfolio-stats-unavailable')).toHaveText('Consultando estatísticas…')
  resume()
  await expect(section.locator('.portfolio-stats-content')).toHaveAttribute('aria-busy','false')
  await expect(section.locator('[data-country="BR"]')).toBeVisible()
  await expect(section.locator('.visitor-detail')).toContainText('100 visualizações · 2 países identificados')
  await expect(section.locator('.visitor-sidebar')).toContainText('Localização não identificada: 10')
})
