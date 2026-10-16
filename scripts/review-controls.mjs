import {chromium} from '@playwright/test'
import fs from 'node:fs/promises'
const browser=await chromium.launch({channel:'chrome',headless:true})
const context=await browser.newContext({viewport:{width:390,height:844},reducedMotion:'reduce'})
await context.addInitScript(()=>localStorage.setItem('pp:visits:consent:v1',JSON.stringify({choice:'declined',at:Date.now()})))
const page=await context.newPage();await page.goto('https://pedropaulo-dev.vercel.app/',{waitUntil:'networkidle'})
for(const id of ['inicio','sobre','projetos','demonstracao','competencias','contato']) {const section=page.locator(`#${id}`);await section.scrollIntoViewIfNeeded();await page.waitForTimeout(100);await section.screenshot({path:`artifacts/review-public/section-${id}-390.png`})}
console.log(JSON.stringify(await page.evaluate(()=>[...document.querySelectorAll('a,button,input,select,summary')].filter(e=>{const r=e.getBoundingClientRect(),s=getComputedStyle(e);return r.width>0&&r.height>0&&s.visibility!=='hidden'&&(r.width<24||r.height<24)&&!e.closest('svg')}).map(e=>({tag:e.tagName,text:(e.getAttribute('aria-label')||e.textContent).trim().slice(0,80),class:e.className,width:Math.round(e.getBoundingClientRect().width),height:Math.round(e.getBoundingClientRect().height)}))),null,2))
await browser.close()
