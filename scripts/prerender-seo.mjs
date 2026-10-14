import { mkdir, readFile, writeFile } from 'node:fs/promises'
const base = 'https://pedropaulo-dev.vercel.app'
const routes = [
  ['', 'Pedro Paulo | Automação, Integrações e Desenvolvimento', 'Projetos de automação de processos, integração de sistemas, APIs e desenvolvimento de soluções web.'],
  ['recrutador', 'Perfil profissional em 60 segundos | Pedro Paulo', 'Resumo profissional de Pedro Paulo: automação, integrações, desenvolvimento web e projetos práticos.'],
  ['projetos/reading-keepedu', 'Reading KeepEdu | Estudo de caso — Pedro Paulo', 'Processamento e gestão de avaliações com React, Python, FastAPI, MySQL e integração KeepEdu.'],
  ['projetos/atendimento-leads', 'Atendimento e qualificação de leads | Pedro Paulo', 'Automação de atendimento, identificação de intenção e roteamento integrado ao CRM.'],
  ['projetos/avaliacoes-experiencia', 'Avaliações de experiência | Estudo de caso — Pedro Paulo', 'Automação de prazos, formulários, notificações e encaminhamentos para avaliações de experiência.'],
  ['projetos/solicitacoes-cancelamento', 'Gestão de cancelamentos | Estudo de caso — Pedro Paulo', 'Formulário e automação para registrar e acompanhar solicitações de cancelamento.'],
  ['projetos/acessos-educacionais', 'Acessos educacionais Bernoulli | Estudo de caso — Pedro Paulo', 'Automação para validar estudantes e desativar acessos educacionais quando aplicável.'],
  ['projetos/orquestrador-educacional', 'Orquestrador educacional | Estudo de caso — Pedro Paulo', 'Proposta de arquitetura para integrar sistemas educacionais com validações, filas e logs.'],
]
const source = await readFile('dist/index.html', 'utf8')
for (const [path, title, description] of routes) {
  const url = path ? `${base}/${path}` : base
  const seo = `<title>${title}</title><meta name="description" content="${description}"><link rel="canonical" href="${url}"><meta property="og:type" content="website"><meta property="og:locale" content="pt_BR"><meta property="og:title" content="${title}"><meta property="og:description" content="${description}"><meta property="og:url" content="${url}"><meta property="og:image" content="${base}/og-image.png"><meta property="og:image:width" content="1200"><meta property="og:image:height" content="630"><meta name="twitter:card" content="summary_large_image"><meta name="twitter:title" content="${title}"><meta name="twitter:description" content="${description}"><meta name="twitter:image" content="${base}/og-image.png">`
  const data = !path ? `<script type="application/ld+json">{"@context":"https://schema.org","@graph":[{"@type":"Person","name":"Pedro Paulo","email":"mailto:ppmendes1519@gmail.com","url":"${base}"},{"@type":"WebSite","name":"Portfólio Pedro Paulo","url":"${base}"}]}</script>` : ''
  const html = source.replace(/<title>[\s\S]*?<\/title>/, seo + data).replace('<div id="root"></div>', `<div id="root"></div><noscript><main><h1>${title}</h1><p>${description}</p></main></noscript>`)
  const target = path ? `dist/${path}` : 'dist'; await mkdir(target, { recursive: true }); await writeFile(`${target}/index.html`, html)
}
