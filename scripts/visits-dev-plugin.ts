import type { Plugin } from 'vite'
import { handleVisits } from '../server/visits.ts'

// Runs the SAME API locally. No mock numbers or in-memory production database.
export function visitsDevPlugin(env: Record<string, string | undefined>): Plugin {
  return {
    name: 'portfolio-visits-api',
    configureServer(server) {
      server.middlewares.use('/api/visits', async (incoming, outgoing) => {
        try {
          const headers = new Headers()
          for (const [name, value] of Object.entries(incoming.headers)) {
            if (value) headers.set(name, Array.isArray(value) ? value.join(',') : value)
          }
          let body = ''
          for await (const chunk of incoming) {
            body += String(chunk)
            if (Buffer.byteLength(body) > 1024) {
              outgoing.writeHead(413, { 'Content-Type': 'application/json' })
              outgoing.end(JSON.stringify({ error: 'payload_too_large' }))
              return
            }
          }
          const request = new Request(`http://${incoming.headers.host || '127.0.0.1:5173'}/api/visits`, {
            method: incoming.method, headers,
            ...(incoming.method !== 'GET' && incoming.method !== 'HEAD' ? { body } : {}),
          })
          const response = await handleVisits(request, { env })
          outgoing.writeHead(response.status, Object.fromEntries(response.headers))
          outgoing.end(await response.text())
        } catch {
          outgoing.writeHead(503, { 'Content-Type': 'application/json' })
          outgoing.end(JSON.stringify({ available: false, reason: 'temporarily_unavailable' }))
        }
      })
    },
  }
}
