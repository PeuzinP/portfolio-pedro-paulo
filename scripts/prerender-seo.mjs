import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { seoRoutes as routes, siteUrl as base } from './seo-routes.mjs'
const source = await readFile('dist/index.html', 'utf8')
for (const { path, title, description } of routes) {
  const url = path ? `${base}/${path}` : base
  const seo = `<title>${title}</title><meta name="description" content="${description}"><link rel="canonical" href="${url}"><meta property="og:type" content="website"><meta property="og:locale" content="pt_BR"><meta property="og:title" content="${title}"><meta property="og:description" content="${description}"><meta property="og:url" content="${url}"><meta property="og:image" content="${base}/og-pedro-paulo.png"><meta property="og:image:width" content="1200"><meta property="og:image:height" content="630"><meta name="twitter:card" content="summary_large_image"><meta name="twitter:title" content="${title}"><meta name="twitter:description" content="${description}"><meta name="twitter:image" content="${base}/og-pedro-paulo.png">`
  const data = !path ? `<script type="application/ld+json">{"@context":"https://schema.org","@graph":[{"@type":"Person","name":"Pedro Paulo","email":"mailto:ppmendes1519@gmail.com","url":"${base}"},{"@type":"WebSite","name":"Portfólio Pedro Paulo","url":"${base}"}]}</script>` : ''
  const html = source.replace(/<title>[\s\S]*?<\/title>/, seo + data).replace('<div id="root"></div>', `<div id="root"></div><noscript><main><h1>${title}</h1><p>${description}</p></main></noscript>`)
  const target = path ? `dist/${path}` : 'dist'; await mkdir(target, { recursive: true }); await writeFile(`${target}/index.html`, html)
}
