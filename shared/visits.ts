export type VisitStats = {
  available: true
  views: number
  uniqueVisitors: number
  estimated: true
  consentOnly: true
  updatedAt: string
  countries?: { code: string; views: number }[]
  unknownViews?: number
  period?: 'all'
}

export type VisitPayload = {
  eventId: string
  visitorId: string
  occurredAt: number
  consent: true
}

export function isVisitStats(value: unknown): value is VisitStats {
  if (!value || typeof value !== 'object') return false
  const data = value as Partial<VisitStats>
  if (data.countries !== undefined) {
    if (!Array.isArray(data.countries) || data.period !== 'all'
      || !Number.isSafeInteger(data.unknownViews) || data.unknownViews! < 0) return false
    const codes = new Set<string>()
    let known = 0
    for (const row of data.countries) {
      if (!row || typeof row.code !== 'string' || !/^[A-Z]{2}$/.test(row.code)
        || codes.has(row.code) || !Number.isSafeInteger(row.views) || row.views < 0) return false
      codes.add(row.code)
      known += row.views
    }
    if (known + data.unknownViews! !== data.views) return false
  }
  return data.available === true && data.estimated === true && data.consentOnly === true
    && Number.isSafeInteger(data.views) && data.views! >= 0
    && Number.isSafeInteger(data.uniqueVisitors) && data.uniqueVisitors! >= 0
    && typeof data.updatedAt === 'string' && Number.isFinite(Date.parse(data.updatedAt))
}

export const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
