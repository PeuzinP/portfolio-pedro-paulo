import { BRAZIL_STATES } from '../shared/brazil-states.ts'

export type RedisConfig = { url: string; token: string; prefix: string }
export type RedisCommand = (command: (string | number)[]) => Promise<unknown>

// Both public reads and writes get consistent snapshots. Lua executes atomically;
// a pipeline alone would not protect deduplication + INCR + PFADD from races.
export const READ_VISITS = `
local global = redis.call('INCR', KEYS[3])
if global == 1 then redis.call('EXPIRE', KEYS[3], 120) end
local network = redis.call('INCR', KEYS[4])
if network == 1 then redis.call('EXPIRE', KEYS[4], 120) end
if global > 1200 or network > 120 then return {-1, 0, 0} end
return {0, tonumber(redis.call('GET', KEYS[1]) or '0'), redis.call('PFCOUNT', KEYS[2]), redis.call('HGETALL', KEYS[5]), redis.call('HGETALL', KEYS[6])}
`

export const REGISTER_VISIT = `
local global = redis.call('INCR', KEYS[4])
if global == 1 then redis.call('EXPIRE', KEYS[4], 120) end
local network = redis.call('INCR', KEYS[5])
if network == 1 then redis.call('EXPIRE', KEYS[5], 120) end
local visitor = redis.call('INCR', KEYS[6])
if visitor == 1 then redis.call('EXPIRE', KEYS[6], 120) end
if global > 600 or network > 30 or visitor > 12 then return {-1, 0, 0} end
if redis.call('EXISTS', KEYS[3]) == 1 then
  return {0, tonumber(redis.call('GET', KEYS[1]) or '0'), redis.call('PFCOUNT', KEYS[2]), redis.call('HGETALL', KEYS[7]), redis.call('HGETALL', KEYS[8])}
end
redis.call('SET', KEYS[3], '1', 'EX', 86400)
local views = redis.call('INCR', KEYS[1])
redis.call('PFADD', KEYS[2], ARGV[1])
if ARGV[2] ~= '' then redis.call('HINCRBY', KEYS[7], ARGV[2], 1) end
if ARGV[2] == 'BR' and ARGV[3] ~= '' then redis.call('HINCRBY', KEYS[8], ARGV[3], 1) end
return {1, views, redis.call('PFCOUNT', KEYS[2]), redis.call('HGETALL', KEYS[7]), redis.call('HGETALL', KEYS[8])}
`

export function createRedisCommand(config: RedisConfig, transport: typeof fetch = fetch): RedisCommand {
  return async command => {
    const response = await transport(config.url, {
      method: 'POST',
      headers: { Authorization: `Bearer ${config.token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(command),
      signal: AbortSignal.timeout(4000),
      cache: 'no-store',
    })
    if (!response.ok) throw new Error('Redis unavailable')
    const data = await response.json() as { result?: unknown; error?: unknown }
    if (data.error || !('result' in data)) throw new Error('Redis command failed')
    return data.result
  }
}

export async function visitOperation(command: RedisCommand, prefix: string, bucket: number, network: string, event?: { id: string; visitor: string; country?: string; state?: string }) {
  const keys = [`${prefix}:views`, `${prefix}:uniques`]
  if (event) {
    keys.push(`${prefix}:event:${event.id}`, `${prefix}:write:${bucket}`, `${prefix}:write:${bucket}:${network}`, `${prefix}:visitor:${bucket}:${event.visitor}`)
  } else {
    keys.push(`${prefix}:read:${bucket}`, `${prefix}:read:${bucket}:${network}`)
  }
  keys.push(`${prefix}:countries`)
  keys.push(`${prefix}:brazil-states`)
  const result = await command(['EVAL', event ? REGISTER_VISIT : READ_VISITS, keys.length, ...keys, ...(event ? [event.visitor, event.country ?? '', event.state ?? ''] : [])])
  if (!Array.isArray(result) || ![3, 4, 5].includes(result.length) || !result.slice(0, 3).every(Number.isSafeInteger)
    || ![-1, 0, 1].includes(result[0]) || result[1] < 0 || result[2] < 0) throw new Error('Invalid Redis response')
  const countries: { code: string; views: number }[] = []
  if (result.length >= 4) {
    const rows = result[3]
    if (!Array.isArray(rows) || rows.length % 2) throw new Error('Invalid countries')
    for (let i = 0; i < rows.length; i += 2) {
      const code = rows[i], views = Number(rows[i + 1])
      if (typeof code !== 'string' || !/^[A-Z]{2}$/.test(code) || !Number.isSafeInteger(views) || views < 0) throw new Error('Invalid country')
      countries.push({ code, views })
    }
  }
  const known = countries.reduce((sum, row) => sum + row.views, 0)
  if (known > result[1]) throw new Error('Inconsistent countries')
  const brazilStates: { code: string; views: number }[] = []
  if (result.length === 5) {
    const rows = result[4]
    if (!Array.isArray(rows) || rows.length % 2) throw new Error('Invalid states')
    const codes = new Set<string>()
    for (let i = 0; i < rows.length; i += 2) {
      const code = rows[i], views = Number(rows[i + 1])
      if (typeof code !== 'string' || !Object.hasOwn(BRAZIL_STATES, code) || codes.has(code)
        || !Number.isSafeInteger(views) || views < 0) throw new Error('Invalid state')
      codes.add(code)
      brazilStates.push({ code, views })
    }
  }
  const brazilViews = countries.find(row => row.code === 'BR')?.views ?? 0
  const knownStates = brazilStates.reduce((sum, row) => sum + row.views, 0)
  if (knownStates > brazilViews) throw new Error('Inconsistent states')
  return { limited: result[0] === -1, recorded: result[0] === 1, views: result[1] as number, uniqueVisitors: result[2] as number,
    countries: countries.sort((a, b) => b.views - a.views || a.code.localeCompare(b.code)), unknownViews: result[1] - known,
    brazilStates: brazilStates.sort((a, b) => b.views - a.views || a.code.localeCompare(b.code)), unknownBrazilStateViews: brazilViews - knownStates }
}
