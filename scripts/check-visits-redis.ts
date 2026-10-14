import assert from 'node:assert/strict'
import { randomBytes, randomUUID } from 'node:crypto'
import { createRedisCommand } from '../server/visits-store.ts'
import { handleVisits } from '../server/visits.ts'

const url = process.env.UPSTASH_REDIS_REST_URL
const token = process.env.UPSTASH_REDIS_REST_TOKEN
if (!url || !token) {
  console.log('NOT RUN: configure UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN in .env.local to test a real Redis database.')
  process.exitCode = 2
} else {
  // Every test key belongs to a new, isolated namespace; never use production keys.
  const prefix = `portfolio:test:${randomUUID()}`
  const env = { UPSTASH_REDIS_REST_URL: url, UPSTASH_REDIS_REST_TOKEN: token, ANALYTICS_SECRET: randomBytes(32).toString('hex'), ANALYTICS_KEY_PREFIX: prefix }
  const realCommand = createRedisCommand({ url, token, prefix })
  const keys = new Set<string>()
  const command = async (args: (string | number)[]) => {
    if (args[0] === 'EVAL') for (const key of args.slice(3, 3 + Number(args[2]))) keys.add(String(key))
    return realCommand(args)
  }
  const id = randomUUID()
  const base = 'https://test.example'
  const post = (eventId: string, visitorId = id) => handleVisits(new Request(`${base}/api/visits`, { method: 'POST',
    headers: { Origin: base, 'Content-Type': 'application/json', 'User-Agent': 'PortfolioIntegrationTest/1.0' },
    body: JSON.stringify({ eventId, visitorId, consent: true, occurredAt: Date.now() }),
  }), { env, command })
  const stats = async () => {
    const response = await handleVisits(new Request(`${base}/api/visits`), { env, command })
    assert.equal(response.status, 200)
    return response.json() as Promise<{ views: number; uniqueVisitors: number }>
  }
  try {
    assert.equal((await stats()).views, 0)
    const event = randomUUID()
    const duplicates = await Promise.all(Array.from({ length: 5 }, () => post(event)))
    assert.ok(duplicates.every(response => response.status === 200))
    assert.equal((await stats()).views, 1, 'Concurrent retries of the same event must increment exactly once')
    const independent = await Promise.all(Array.from({ length: 5 }, () => post(randomUUID())))
    assert.ok(independent.every(response => response.status === 200))
    assert.deepEqual(await stats().then(({ views, uniqueVisitors }) => ({ views, uniqueVisitors })), { views: 6, uniqueVisitors: 1 })
    await Promise.all([post(randomUUID(), randomUUID()), post(randomUUID(), randomUUID())])
    assert.deepEqual(await stats().then(({ views, uniqueVisitors }) => ({ views, uniqueVisitors })), { views: 8, uniqueVisitors: 3 })
    const newClient = createRedisCommand({ url, token, prefix })
    assert.equal(await newClient(['GET', `${prefix}:views`]), '8', 'Counters must persist across new server clients')
    assert.equal(await newClient(['TTL', `${prefix}:views`]), -1, 'Aggregate counters must not expire')
    console.log('PASS: real Redis atomic concurrency, retry deduplication, unique visitors and persistence across clients.')
  } finally {
    const owned = [...keys]
    assert.ok(owned.every(key => key.startsWith(`${prefix}:`)))
    if (owned.length) await realCommand(['DEL', ...owned])
  }
}
