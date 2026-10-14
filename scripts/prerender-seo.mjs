import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { seoRoutes as routes, siteUrl as base } from './seo-routes.mjs'
const source = await readFile('dist/index.html', 'utf8')
function staticContent(path, title, description) {
  if (!path) return `<main><h1>Pedro Paulo — Automação, Integrações e Desenvolvimento</h1><p>${description}</p><nav><a href="/recrutador">Perfil profissional</a><a href="/projetos/reading-keepedu">Estudos de caso</a></nav><h2>Projetos em destaque</h2><ul><li><a href="/projetos/reading-keepedu">Reading KeepEdu</a></li><li><a href="/projetos/atendimento-leads">Atendimento e qualificação de leads</a></li><li><a href="/projetos/avaliacoes-experiencia">Avaliações de experiência</a></li></ul></main>`
  if (path === 'recrutador') return `<main><h1>${title}</h1><p>${description}</p><h2>Especialidades</h2><p>Automação de processos, integração de sistemas e APIs, desenvolvimento de soluções web, CRM e qualificação de leads.</p><p><a href="/">Portfólio</a> · <a href="/projetos/reading-keepedu">Projetos</a></p></main>`
  return `<main><article><p>Estudo de caso</p><h1>${title}</h1><p>${description}</p><h2>Visão geral</h2><p>Este estudo de caso descreve contexto, desafio, solução, tecnologias e fluxo operacional do projeto.</p><p><a href="/">Voltar ao portfólio</a> · <a href="/projetos/reading-keepedu">Outros projetos</a></p></article></main>`
}
for (const { path, title, description } of routes) {
  const url = path ? `${base}/${path}` : base
  const seo = `<title>${title}</title><meta name="description" content="${description}"><link rel="canonical" href="${url}"><meta property="og:type" content="website"><meta property="og:locale" content="pt_BR"><meta property="og:title" content="${title}"><meta property="og:description" content="${description}"><meta property="og:url" content="${url}"><meta property="og:image" content="${base}/og-pedro-paulo.png"><meta property="og:image:width" content="1200"><meta property="og:image:height" content="630"><meta name="twitter:card" content="summary_large_image"><meta name="twitter:title" content="${title}"><meta name="twitter:description" content="${description}"><meta name="twitter:image" content="${base}/og-pedro-paulo.png">`
  const data = !path ? `<script type="application/ld+json">{"@context":"https://schema.org","@graph":[{"@type":"Person","name":"Pedro Paulo","email":"mailto:ppmendes1519@gmail.com","url":"${base}"},{"@type":"WebSite","name":"Portfólio Pedro Paulo","url":"${base}"}]}</script>` : ''
  const html = source.replace(/<title>[\s\S]*?<\/title>/, seo + data).replace('<div id="root"></div>', `<div id="root">${staticContent(path, title, description)}</div>`).replace(/<noscript>[\s\S]*?<\/noscript>/, '')
  const target = path ? `dist/${path}` : 'dist'; await mkdir(target, { recursive: true }); await writeFile(`${target}/index.html`, html)
}
