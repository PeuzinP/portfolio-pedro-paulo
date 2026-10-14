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
return {0, tonumber(redis.call('GET', KEYS[1]) or '0'), redis.call('PFCOUNT', KEYS[2])}
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
  return {0, tonumber(redis.call('GET', KEYS[1]) or '0'), redis.call('PFCOUNT', KEYS[2])}
end
redis.call('SET', KEYS[3], '1', 'EX', 86400)
local views = redis.call('INCR', KEYS[1])
redis.call('PFADD', KEYS[2], ARGV[1])
return {1, views, redis.call('PFCOUNT', KEYS[2])}
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

export async function visitOperation(command: RedisCommand, prefix: string, bucket: number, network: string, event?: { id: string; visitor: string }) {
  const keys = [`${prefix}:views`, `${prefix}:uniques`]
  if (event) {
    keys.push(`${prefix}:event:${event.id}`, `${prefix}:write:${bucket}`, `${prefix}:write:${bucket}:${network}`, `${prefix}:visitor:${bucket}:${event.visitor}`)
  } else {
    keys.push(`${prefix}:read:${bucket}`, `${prefix}:read:${bucket}:${network}`)
  }
  const result = await command(['EVAL', event ? REGISTER_VISIT : READ_VISITS, keys.length, ...keys, ...(event ? [event.visitor] : [])])
  if (!Array.isArray(result) || result.length !== 3 || !result.every(Number.isSafeInteger)
    || ![-1, 0, 1].includes(result[0]) || result[1] < 0 || result[2] < 0) throw new Error('Invalid Redis response')
  return { limited: result[0] === -1, recorded: result[0] === 1, views: result[1] as number, uniqueVisitors: result[2] as number }
}
