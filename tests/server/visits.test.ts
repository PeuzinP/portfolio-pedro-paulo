import { test } from 'node:test'
import assert from 'node:assert/strict'
import { randomUUID } from 'node:crypto'
import { handleVisits } from '../../server/visits.ts'
import { createRedisCommand, visitOperation, REGISTER_VISIT } from '../../server/visits-store.ts'
import { isVisitStats } from '../../shared/visits.ts'

const now = Date.now()
const env = { UPSTASH_REDIS_REST_URL: 'https://test.upstash.io', UPSTASH_REDIS_REST_TOKEN: 'server-token', ANALYTICS_SECRET: 'test-secret-only-not-a-real-key-123456789', VERCEL: '1', VERCEL_ENV: 'production' }
const payload = () => ({ eventId: randomUUID(), visitorId: randomUUID(), occurredAt: now, consent: true })
function request(body: unknown = payload(), headers: Record<string, string> = {}) {
  return new Request('https://portfolio.example/api/visits', { method: 'POST', headers: {
    Origin: 'https://portfolio.example', 'Content-Type': 'application/json', 'User-Agent': 'Mozilla/5.0 Chrome/131.0', ...headers,
  }, body: typeof body === 'string' ? body : JSON.stringify(body) })
}
const dependencies = { env, now: () => now, command: async () => [1, 42, 23] }

test('missing configuration is unavailable, never fabricated zero totals', async () => {
  const response = await handleVisits(new Request('https://portfolio.example/api/visits'), { env: {} })
  assert.deepEqual(await response.json(), { available: false, reason: 'not_configured' })
  assert.equal((await handleVisits(request(), { env: {} })).status, 503)
})

test('valid POST returns the authoritative Redis result and no identity', async () => {
  const response = await handleVisits(request(), dependencies)
  const data = await response.json()
  assert.equal(response.status, 200)
  assert.equal(response.headers.get('cache-control'), 'private, no-store')
  assert.equal(response.headers.get('access-control-allow-origin'), null)
  assert.ok(isVisitStats(data))
  assert.equal(data.views, 42)
  assert.equal(data.uniqueVisitors, 23)
  assert.equal('visitorId' in data, false)
})

test('GET returns actual zeroes only when Redis reports an empty database', async () => {
  const response = await handleVisits(new Request('https://portfolio.example/api/visits'), { ...dependencies, command: async () => [0, 0, 0] })
  const data = await response.json()
  assert.ok(isVisitStats(data))
  assert.equal(data.views, 0)
})

test('method, origin, bot and media-type protections reject before touching Redis', async () => {
  let calls = 0
  const options = { ...dependencies, command: async () => { calls++; return [1, 1, 1] } }
  assert.equal((await handleVisits(new Request('https://portfolio.example/api/visits', { method: 'DELETE' }), options)).status, 405)
  assert.equal((await handleVisits(request(payload(), { Origin: 'https://evil.example' }), options)).status, 403)
  assert.equal((await handleVisits(request(payload(), { Origin: '' }), options)).status, 403)
  assert.equal((await handleVisits(request(payload(), { 'Sec-Fetch-Site': 'cross-site' }), options)).status, 403)
  assert.equal((await handleVisits(request(payload(), { 'User-Agent': 'Googlebot' }), options)).status, 403)
  assert.equal((await handleVisits(request(payload(), { 'Content-Type': 'text/plain' }), options)).status, 415)
  assert.equal(calls, 0)
})

test('validates identifiers, consent, timestamps and rejects client-supplied counters', async () => {
  for (const body of [{ ...payload(), visitorId: 'bad' }, { ...payload(), eventId: 'bad' }, { ...payload(), consent: false },
    { ...payload(), occurredAt: now - 901_000 }, { ...payload(), occurredAt: now + 61_000 }, { ...payload(), views: 9000 }, [], null]) {
    assert.equal((await handleVisits(request(body), dependencies)).status, 400)
  }
  assert.equal((await handleVisits(request('{broken'), dependencies)).status, 400)
  assert.equal((await handleVisits(request('x'.repeat(1025)), dependencies)).status, 413)
})

test('does not store raw browser identifiers or raw IPs; rate keys rotate every minute', async () => {
  const commands: (string | number)[][] = []
  const body = payload()
  const command = async (value: (string | number)[]) => { commands.push(value); return [1, 1, 1] }
  await handleVisits(request(body, { 'x-vercel-forwarded-for': '192.0.2.42' }), { ...dependencies, command })
  await handleVisits(request(body, { 'x-vercel-forwarded-for': '192.0.2.42' }), { ...dependencies, now: () => now + 60_000, command })
  const serialized = JSON.stringify(commands)
  assert.equal(serialized.includes(body.visitorId), false)
  assert.equal(serialized.includes(body.eventId), false)
  assert.equal(serialized.includes('192.0.2.42'), false)
  assert.equal(commands[0][1], REGISTER_VISIT)
  assert.equal(commands[0][5], commands[1][5], 'event deduplication must survive a rate window change')
  assert.notEqual(commands[0][7], commands[1][7], 'security key must change per minute')
})

test('uses atomic command outcome for duplicate submissions and rate limits', async () => {
  const duplicate = await handleVisits(request(), { ...dependencies, command: async () => [0, 42, 23] })
  assert.equal((await duplicate.json()).recorded, false)
  const limited = await handleVisits(request(), { ...dependencies, command: async () => [-1, 0, 0] })
  assert.equal(limited.status, 429)
  assert.ok(Number(limited.headers.get('retry-after')) > 0)
})

test('database failures and corrupt results stay unavailable without leaking secrets', async () => {
  for (const command of [async () => { throw new Error(env.UPSTASH_REDIS_REST_TOKEN) }, async () => [1, 'fake', 1], async () => [1, -1, 0]]) {
    const response = await handleVisits(request(), { ...dependencies, command })
    assert.equal(response.status, 503)
    assert.deepEqual(await response.json(), { available: false, reason: 'temporarily_unavailable' })
  }
})

test('production, preview and local counters are isolated', async () => {
  for (const scope of ['production', 'preview', 'development']) {
    let key = ''
    await handleVisits(request(), { ...dependencies, env: { ...env, VERCEL_ENV: scope }, command: async value => { key = String(value[3]); return [1, 1, 1] } })
    assert.equal(key, `portfolio:${scope}:v1:views`)
  }
})

test('REST transport sends credentials only as server Authorization and handles Upstash errors', async () => {
  const config = { url: env.UPSTASH_REDIS_REST_URL, token: env.UPSTASH_REDIS_REST_TOKEN, prefix: 'test' }
  const command = createRedisCommand(config, async (url, options) => {
    assert.equal(url, config.url)
    assert.equal(new Headers(options?.headers).get('Authorization'), `Bearer ${config.token}`)
    assert.deepEqual(JSON.parse(String(options?.body)), ['PING'])
    return Response.json({ result: 'PONG' })
  })
  assert.equal(await command(['PING']), 'PONG')
  const broken = createRedisCommand(config, async () => Response.json({ error: 'upstream detail' }))
  await assert.rejects(() => broken(['PING']), /Redis command failed/)
  await assert.rejects(() => visitOperation(async () => null, 'test', 0, 'network'), /Invalid Redis response/)
})

test('country aggregation uses trusted Vercel headers and keeps old views unknown', async () => {
  let captured: (string | number)[] = []
  const command = async (value: (string | number)[]) => { captured=value; return [1, 100, 45, ['BR', '60', 'US', '30']] }
  const response = await handleVisits(request(payload(), { 'x-vercel-ip-country': 'BR' }), { ...dependencies, command })
  const data=await response.json()
  assert.deepEqual(data.countries, [{ code:'BR', views:60 }, { code:'US', views:30 }])
  assert.equal(data.unknownViews,10)
  assert.equal(captured.at(-2),'BR')
  await handleVisits(request(payload(), { 'x-vercel-ip-country':'BR' }), { ...dependencies, env:{...env,VERCEL:'0'}, command })
  assert.equal(captured.at(-2),'')
  await handleVisits(request(payload(), { 'x-vercel-ip-country':'XX' }), { ...dependencies, command })
  assert.equal(captured.at(-2),'')
})
test('inconsistent country snapshots are rejected',async()=>{
 const response=await handleVisits(request(),{...dependencies,command:async()=>[1,10,5,['BR','11']]})
 assert.equal(response.status,503)
})

test('Brazilian states use only trusted region headers, without guessing historical states', async () => {
  let captured: (string | number)[] = []
  const command = async (value: (string | number)[]) => { captured = value; return [1,100,45,['BR','60','US','30'],['MG','20','SP','10']] }
  const response = await handleVisits(request(payload(), {'x-vercel-ip-country':'BR','x-vercel-ip-country-region':'MG'}), {...dependencies,command})
  const data = await response.json()
  assert.equal(response.status,200)
  assert.ok(isVisitStats(data))
  assert.deepEqual(data.brazilStates,[{code:'MG',views:20},{code:'SP',views:10}])
  assert.equal(data.unknownBrazilStateViews,30)
  assert.equal(captured.at(-1),'MG')
  assert.equal(captured.at(-2),'BR')
  assert.equal(captured.includes('portfolio:production:v1:brazil-states'),true)
  const invalidHeaders: Record<string, string>[] = [ {'x-vercel-ip-country':'US','x-vercel-ip-country-region':'MG'}, {'x-vercel-ip-country':'BR','x-vercel-ip-country-region':'XX'}, {'x-vercel-ip-country':'BR'} ]
  for (const headers of invalidHeaders) {
    await handleVisits(request(payload(),headers), {...dependencies,command})
    assert.equal(captured.at(-1),'')
  }
  await handleVisits(request(payload(),{'x-vercel-ip-country':'BR','x-vercel-ip-country-region':'MG'}), {...dependencies,command,env:{...env,VERCEL:'0'}})
  assert.equal(captured.at(-1),'')
})

test('invalid state snapshots stay unavailable and inconsistent client snapshots are rejected',async()=>{
  for(const states of [['MG','61'],['XX','1'],['MG','1','MG','1'],['MG','-1'],['MG']]) {
    const response=await handleVisits(request(),{...dependencies,command:async()=>[1,100,45,['BR','60'],states]})
    assert.equal(response.status,503)
  }
  const base={available:true,views:100,uniqueVisitors:45,estimated:true,consentOnly:true,period:'all',countries:[{code:'BR',views:60}],unknownViews:40,updatedAt:new Date(now).toISOString()}
  assert.equal(isVisitStats({...base,brazilStates:[{code:'MG',views:20}],unknownBrazilStateViews:40}),true)
  assert.equal(isVisitStats({...base,brazilStates:[{code:'MG',views:20}],unknownBrazilStateViews:30}),false)
})
