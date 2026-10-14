import assert from 'node:assert/strict'

const target = process.argv[2]
if (!target) {
  console.log('NOT RUN: use npm run test:deployment -- https://YOUR-DEPLOYMENT.vercel.app after configuring Redis and deploying.')
  process.exitCode = 2
} else {
  const url = new URL('/api/visits', target)
  assert.equal(url.protocol, 'https:', 'Use the HTTPS deployment URL')
  const response = await fetch(url, { signal: AbortSignal.timeout(15000) })
  assert.equal(response.status, 200)
  const stats = await response.json()
  assert.equal(stats.available, true, 'Database not configured or unavailable on this deployment')
  assert.ok(Number.isSafeInteger(stats.views) && stats.views >= 0)
  assert.ok(Number.isSafeInteger(stats.uniqueVisitors) && stats.uniqueVisitors >= 0)
  assert.equal(stats.estimated, true)
  assert.equal(stats.consentOnly, true)
  console.log('PASS: deployed API returns persistent statistics. This read-only check did not add a visit. Complete the consent/reload checks in docs/visits.md.')
}
