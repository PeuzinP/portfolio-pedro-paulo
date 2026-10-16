import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { siteConfig } from './src/data/portfolio'
import { visitsDevPlugin } from './scripts/visits-dev-plugin'

export default defineConfig(({ mode }) => ({
  plugins: [react(), tailwindcss(), visitsDevPlugin({ ...process.env, ...loadEnv(mode, process.cwd(), '') }), {
    name: 'portfolio-metadata',
    transformIndexHtml() {
      if (!siteConfig.siteUrl) return []
      const url = new URL(siteConfig.siteUrl).origin
      return [
        { tag: 'meta', attrs: { property: 'og:image:alt', content: 'Pedro Paulo — Automação, Integrações e Desenvolvimento' }, injectTo: 'head' },
        { tag: 'script', attrs: { type: 'application/ld+json' }, children: JSON.stringify({ '@context': 'https://schema.org', '@type': 'Person', name: siteConfig.name, url, description: siteConfig.description, homeLocation: { '@type': 'Place', name: siteConfig.location }, knowsAbout: ['Automação de processos', 'Integração de sistemas', 'CRM', 'Desenvolvimento web'] }).replace(/</g, '\\u003c'), injectTo: 'head' },
      ]
    },
  }],
}))
