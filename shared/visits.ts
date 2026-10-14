export type VisitStats = {
  available: true
  views: number
  uniqueVisitors: number
  estimated: true
  consentOnly: true
  updatedAt: string
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
  return data.available === true && data.estimated === true && data.consentOnly === true
    && Number.isSafeInteger(data.views) && data.views! >= 0
    && Number.isSafeInteger(data.uniqueVisitors) && data.uniqueVisitors! >= 0
    && typeof data.updatedAt === 'string' && Number.isFinite(Date.parse(data.updatedAt))
}

export const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
