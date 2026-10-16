import { createHmac } from 'node:crypto'
import { UUID_PATTERN } from '../shared/visits.ts'
import { BRAZIL_STATES } from '../shared/brazil-states.ts'
import type { VisitPayload } from '../shared/visits.ts'
import { createRedisCommand, visitOperation } from './visits-store.ts'
import type { RedisCommand } from './visits-store.ts'

type Environment = Record<string, string | undefined>
type Dependencies = { env?: Environment; command?: RedisCommand; now?: () => number }
const MAX_BODY = 1024
const MAX_AGE = 15 * 60 * 1000
const BOT = /bot\b|crawler|spider|slurp|facebookexternalhit|headless|lighthouse|pagespeed|pingdom/i

function json(body: unknown, status = 200, headers: Record<string, string> = {}) {
  return Response.json(body, { status, headers: {
    'Cache-Control': 'private, no-store', 'X-Content-Type-Options': 'nosniff', ...headers,
  } })
}

async function readPayload(request: Request): Promise<unknown> {
  if (Number(request.headers.get('content-length')) > MAX_BODY) throw new RangeError('Body too large')
  const reader = request.body?.getReader()
  if (!reader) throw new Error('Missing body')
  const chunks: Uint8Array[] = []
  let length = 0
  try {
    while (true) {
      const part = await reader.read()
      if (part.done) break
      length += part.value.length
      if (length > MAX_BODY) { await reader.cancel(); throw new RangeError('Body too large') }
      chunks.push(part.value)
    }
  } finally { reader.releaseLock() }
  return JSON.parse(Buffer.concat(chunks).toString('utf8')) as unknown
}

function validPayload(value: unknown, now: number): value is VisitPayload {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false
  const data = value as Partial<VisitPayload>
  return Object.keys(data).every(key => ['eventId', 'visitorId', 'occurredAt', 'consent'].includes(key))
    && data.consent === true && typeof data.eventId === 'string' && UUID_PATTERN.test(data.eventId)
    && typeof data.visitorId === 'string' && UUID_PATTERN.test(data.visitorId)
    && typeof data.occurredAt === 'number' && Number.isSafeInteger(data.occurredAt)
    && data.occurredAt <= now + 60_000 && data.occurredAt >= now - MAX_AGE
}

export async function handleVisits(request: Request, dependencies: Dependencies = {}): Promise<Response> {
  const env = dependencies.env ?? process.env
  const now = (dependencies.now ?? Date.now)()
  if (!['GET', 'POST'].includes(request.method)) return json({ error: 'method_not_allowed' }, 405, { Allow: 'GET, POST' })
  const url = new URL(request.url)
  const origin = request.headers.get('origin')
  // No cross-site writes, CORS allowance, or client-controlled redirect target.
  if (request.headers.get('sec-fetch-site') === 'cross-site' || (origin && origin !== url.origin)
    || (request.method === 'POST' && origin !== url.origin)) return json({ error: 'forbidden_origin' }, 403)
  const userAgent = request.headers.get('user-agent') ?? ''
  if (request.method === 'POST' && (!userAgent || BOT.test(userAgent))) return json({ error: 'automated_request' }, 403)

  let payload: VisitPayload | undefined
  if (request.method === 'POST') {
    if (request.headers.get('content-type')?.split(';')[0].trim() !== 'application/json') return json({ error: 'unsupported_media_type' }, 415)
    try {
      const input = await readPayload(request)
      if (!validPayload(input, now)) return json({ error: 'invalid_visit' }, 400)
      payload = input
    } catch (error) { return json({ error: error instanceof RangeError ? 'payload_too_large' : 'invalid_json' }, error instanceof RangeError ? 413 : 400) }
  }

  const { UPSTASH_REDIS_REST_URL: redisUrl, UPSTASH_REDIS_REST_TOKEN: token, ANALYTICS_SECRET: secret } = env
  // Missing configuration is an explicit unavailable state, never fake zeroes.
  if (!redisUrl || !token || !secret || secret.length < 32) return json({ available: false, reason: 'not_configured' }, payload ? 503 : 200)
  try {
    const endpoint = new URL(redisUrl)
    if (endpoint.protocol !== 'https:' || !endpoint.hostname.endsWith('.upstash.io') || endpoint.username || endpoint.password) throw new Error('Invalid Redis endpoint')
    const scope = env.VERCEL_ENV === 'production' ? 'production' : env.VERCEL_ENV === 'preview' ? 'preview' : 'development'
    const prefix = env.ANALYTICS_KEY_PREFIX || `portfolio:${scope}:v1`
    if (!/^[a-zA-Z0-9:_-]{1,80}$/.test(prefix)) throw new Error('Invalid prefix')
    const digest = (value: string) => createHmac('sha256', secret).update(value).digest('hex')
    const bucket = Math.floor(now / 60_000)
    // Only the Vercel-controlled header is used. IP is never a visitor identity:
    // this rotating security key expires after 120s; raw addresses are not stored.
    const networkAddress = env.VERCEL === '1' ? request.headers.get('x-vercel-forwarded-for')?.split(',')[0].trim() || 'unknown' : 'local'
    const network = digest(`rate:${bucket}:${networkAddress}`)
    const countryHeader = env.VERCEL === '1' ? request.headers.get('x-vercel-ip-country') ?? '' : ''
    const country = /^[A-Z]{2}$/.test(countryHeader) && !['XX', 'ZZ'].includes(countryHeader) ? countryHeader : ''
    const stateHeader = country === 'BR' ? request.headers.get('x-vercel-ip-country-region') ?? '' : ''
    const state = Object.hasOwn(BRAZIL_STATES, stateHeader) ? stateHeader : ''
    const event = payload ? { id: digest(`event:${payload.eventId}`), visitor: digest(`visitor:${payload.visitorId}`), country, state } : undefined
    const command = dependencies.command ?? createRedisCommand({ url: redisUrl, token, prefix })
    const result = await visitOperation(command, prefix, bucket, network, event)
    if (result.limited) return json({ available: false, reason: 'rate_limited' }, 429, { 'Retry-After': String(60 - Math.floor(now / 1000) % 60) })
    return json({ available: true, views: result.views, uniqueVisitors: result.uniqueVisitors, estimated: true,
      consentOnly: true, period: 'all', countries: result.countries, unknownViews: result.unknownViews,
      brazilStates: result.brazilStates, unknownBrazilStateViews: result.unknownBrazilStateViews,
      updatedAt: new Date(now).toISOString(), ...(payload ? { recorded: result.recorded } : {}) })
  } catch {
    // Do not log request bodies, tokens, identifiers, or upstream responses.
    return json({ available: false, reason: 'temporarily_unavailable' }, 503, { 'Retry-After': '30' })
  }
}
