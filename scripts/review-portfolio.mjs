import { chromium } from '@playwright/test'
import fs from 'node:fs/promises'
import { seoRoutes } from './seo-routes.mjs'
const origin=process.argv[2] || 'http://127.0.0.1:5173'
const label=process.argv[3] || 'local'
const directory=`artifacts/review-${label}`
await fs.mkdir(directory,{recursive:true})
const browser=await chromium.launch({channel:'chrome',headless:true})
const report=[]
try {
 for(const width of [360,390,768,1024,1440]) {
  const context=await browser.newContext({viewport:{width,height:900},reducedMotion:'reduce',hasTouch:width<500})
  await context.addInitScript(()=>localStorage.setItem('pp:visits:consent:v1',JSON.stringify({choice:'declined',at:Date.now()})))
  const page=await context.newPage()
  for(const route of seoRoutes) {
   const errors=[];const listener=e=>errors.push(e.message);page.on('pageerror',listener)
   const response=await page.goto(`${origin}/${route.path}`,{waitUntil:'networkidle',timeout:30000}).catch(e=>{errors.push(e.message);return null})
   await page.waitForSelector('.site-header',{timeout:10000}).catch(e=>errors.push(e.message))
   for(const section of await page.locator('main section').all()) {await section.scrollIntoViewIfNeeded({timeout:2000}).catch(()=>{});await page.waitForTimeout(80)}
   await page.evaluate(()=>scrollTo({top:0,behavior:'instant'}))
   const data=await page.evaluate(()=>({title:document.title,canonical:document.querySelector('link[rel="canonical"]')?.href,description:document.querySelector('meta[name="description"]')?.content,scrollWidth:document.documentElement.scrollWidth,width:innerWidth,headings:[...document.querySelectorAll('h1')].map(e=>e.textContent),brokenImages:[...document.images].filter(e=>e.complete && !e.naturalWidth).map(e=>e.src),overflow:[...document.querySelectorAll('main *,footer *')].filter(e=>{const r=e.getBoundingClientRect(),s=getComputedStyle(e);return r.width>0 && (r.right>innerWidth+2 || r.left < -2) && s.position!=='absolute' && s.position!=='fixed' && s.visibility!=='hidden' && !e.closest('svg') && !e.closest('[class*="architecture"]')}).slice(0,12).map(e=>({tag:e.tagName,class:e.className,text:e.textContent.slice(0,80),right:Math.round(e.getBoundingClientRect().right)})),links:[...document.querySelectorAll('a')].map(e=>({text:e.textContent.trim(),href:e.getAttribute('href'),target:e.target}))}))
   if(width===390 || width===1440) await page.screenshot({path:`${directory}/${width}-${route.path.replaceAll('/','-')||'home'}.png`,fullPage:true})
   report.push({path:route.path||'/',width,status:response?.status(),errors,...data})
   page.off('pageerror',listener)
   console.log(JSON.stringify({path:route.path||'/',width,status:response?.status(),overflow:data.scrollWidth>width,overflowElements:data.overflow.length,errors:errors.length}))
  }
  await context.close()
 }
} finally { await fs.writeFile(`${directory}/report.json`,JSON.stringify(report,null,2));await browser.close() }
