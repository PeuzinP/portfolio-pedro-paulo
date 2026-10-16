import { isVisitStats, UUID_PATTERN } from '../../shared/visits'
import type { VisitPayload, VisitStats } from '../../shared/visits'

export const VISIT_KEYS = {
  consent: 'pp:visits:consent:v1',
  browser: 'pp:visits:browser:v1',
  session: 'pp:visits:session:v1',
} as const
const RETENTION = 180 * 24 * 60 * 60 * 1000
type Consent = 'accepted' | 'declined' | null
type BrowserVisit = { id: string; firstVisit: string; lastVisit: string; views: number; sessions: number }
type Session = { welcomeShown: boolean; countedVisitor: string | null }
type VisitState = {
  initialized: boolean
  storageAvailable: boolean
  consent: Consent
  browser: BrowserVisit | null
  previousVisit: string | null
  returning: boolean
  welcomeEligible: boolean
  stats: VisitStats | null
  status: 'loading' | 'ready' | 'unavailable'
}

// One store and one event per document, independent of React mount/unmount cycles.
let state: VisitState = { initialized: false, storageAvailable: true, consent: null, browser: null,
  previousVisit: null, returning: false, welcomeEligible: false, stats: null, status: 'loading' }
let session: Session = { welcomeShown: false, countedVisitor: null }
let started: Promise<void> | undefined
let registered = false
let countedLocally = false
let localTask: Promise<void> | undefined
let statsTask: Promise<void> | undefined
let pendingRequest: AbortController | undefined
const listeners = new Set<() => void>()

function publish(update: Partial<VisitState>) { state = { ...state, ...update }; listeners.forEach(callback => callback()) }
function readJSON(key: string, storage: Storage): unknown { try { return JSON.parse(storage.getItem(key) || 'null') } catch { return null } }
function isDate(value: unknown): value is string { return typeof value === 'string' && Number.isFinite(Date.parse(value)) }
function browserRecord(): BrowserVisit | null {
  const value = readJSON(VISIT_KEYS.browser, localStorage) as Partial<BrowserVisit> | null
  if (!value || typeof value.id !== 'string' || !UUID_PATTERN.test(value.id) || !isDate(value.firstVisit) || !isDate(value.lastVisit)
    || Date.parse(value.firstVisit) > Date.parse(value.lastVisit) || Date.parse(value.lastVisit) > Date.now() + 60_000
    || !Number.isSafeInteger(value.views) || value.views! < 1 || !Number.isSafeInteger(value.sessions) || value.sessions! < 1) return null
  return value as BrowserVisit
}
function readConsent(): Consent {
  const value = readJSON(VISIT_KEYS.consent, localStorage) as { choice?: unknown; at?: unknown } | null
  if (value && (value.choice === 'accepted' || value.choice === 'declined') && typeof value.at === 'number'
    && value.at <= Date.now() && Date.now() - value.at < RETENTION) return value.choice
  localStorage.removeItem(VISIT_KEYS.browser)
  localStorage.removeItem(VISIT_KEYS.consent)
  return null
}
function saveSession() {
  try { sessionStorage.setItem(VISIT_KEYS.session, JSON.stringify(session)) } catch { /* memory-only welcome fallback */ }
}
function probeStorage() {
  try {
    for (const storage of [localStorage, sessionStorage]) {
      const key = 'pp:visits:storage-check'
      storage.setItem(key, '1'); storage.removeItem(key)
    }
    return true
  } catch { return false }
}

function acceptStats(value: unknown) {
  if (!isVisitStats(value)) return false
  // A slower GET must not roll back the fresher POST response.
  if (state.stats && (value.views < state.stats.views || Date.parse(value.updatedAt) < Date.parse(state.stats.updatedAt))) return true
  publish({ stats: value, status: 'ready' })
  return true
}

export function refreshStats(): Promise<void> {
  if (statsTask) return statsTask
  if (!state.stats) publish({ status: 'loading' })
  statsTask = (async () => {
    const abort = new AbortController()
    const timeout = setTimeout(() => abort.abort(), 6000)
    try {
      const response = await fetch('/api/visits', { signal: abort.signal, cache: 'no-store', credentials: 'omit' })
      if (!response.ok || !acceptStats(await response.json())) throw new Error('Unavailable')
    } catch { if (!state.stats) publish({ status: 'unavailable' }) }
    finally { clearTimeout(timeout); statsTask = undefined }
  })()
  return statsTask
}

async function registerView(browserId: string) {
  if (registered || state.consent !== 'accepted' || !state.storageAvailable) return
  registered = true
  const payload: VisitPayload = { eventId: crypto.randomUUID(), visitorId: browserId, occurredAt: Date.now(), consent: true }
  // Only transient failures are retried, once, with the SAME idempotency key.
  for (let attempt = 0; attempt < 2; attempt++) {
    if (state.consent !== 'accepted') return
    const abort = new AbortController()
    pendingRequest = abort
    const timeout = setTimeout(() => abort.abort(), 6000)
    try {
      const response = await fetch('/api/visits', { method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload), signal: abort.signal, cache: 'no-store', credentials: 'omit' })
      if (response.ok && acceptStats(await response.json())) return
      if (response.status < 500) break
    } catch { /* unavailable/offline; keep the local welcome usable */ }
    finally { clearTimeout(timeout); if (pendingRequest === abort) pendingRequest = undefined }
    if (attempt === 0) await new Promise(resolve => setTimeout(resolve, 750))
  }
  if (!state.stats) publish({ status: 'unavailable' })
}

function updateLocalVisit(): Promise<void> {
  if (countedLocally || !state.storageAvailable || state.consent !== 'accepted') return Promise.resolve()
  if (localTask) return localTask
  const update = () => {
    if (state.consent !== 'accepted') return
    const old = browserRecord()
    const now = new Date().toISOString()
    const id = old?.id ?? crypto.randomUUID()
    const browser: BrowserVisit = { id, firstVisit: old?.firstVisit ?? now, lastVisit: now,
      views: (old?.views ?? 0) + 1, sessions: (old?.sessions ?? 0) + (session.countedVisitor === id ? 0 : 1) }
    localStorage.setItem(VISIT_KEYS.browser, JSON.stringify(browser))
    session.countedVisitor = id
    saveSession()
    countedLocally = true
    publish({ browser, previousVisit: old?.lastVisit ?? null, returning: !!old })
    void registerView(id)
  }
  localTask = Promise.resolve().then(async () => {
    try {
      // Serializes simultaneous first visits and read-modify-write across tabs.
      if (navigator.locks) await navigator.locks.request('pp:visits:browser', update)
      else update() // Best effort on old browsers without Web Locks; figures are estimates.
    } catch { publish({ storageAvailable: false, browser: null }) }
    finally { localTask = undefined }
  })
  return localTask
}

export function startVisits(): Promise<void> {
  if (started) return started
  started = (async () => {
    const available = probeStorage()
    let consent: Consent = null
    if (available) {
      try {
        consent = readConsent()
        const saved = readJSON(VISIT_KEYS.session, sessionStorage) as Partial<Session> | null
        session = { welcomeShown: saved?.welcomeShown === true,
          countedVisitor: typeof saved?.countedVisitor === 'string' && UUID_PATTERN.test(saved.countedVisitor) ? saved.countedVisitor : null }
      } catch { /* unavailable storage remains optional */ }
    }
    publish({ storageAvailable: available, consent })
    if (consent === 'accepted') await updateLocalVisit()
    publish({ initialized: true, welcomeEligible: !session.welcomeShown })
    void refreshStats()
  })()
  return started
}

export async function setVisitConsent(choice: Exclude<Consent, null>) {
  publish({ consent: choice })
  try { localStorage.setItem(VISIT_KEYS.consent, JSON.stringify({ choice, at: Date.now() })) }
  catch { publish({ storageAvailable: false }) }
  if (choice === 'accepted') await updateLocalVisit()
  else {
    pendingRequest?.abort()
    countedLocally = false
    try { localStorage.removeItem(VISIT_KEYS.browser) } catch { /* optional storage */ }
    session.countedVisitor = null
    saveSession()
    publish({ browser: null, previousVisit: null })
  }
}

export function claimWelcome() {
  if (!state.welcomeEligible || session.welcomeShown) return false
  session.welcomeShown = true
  saveSession()
  publish({ welcomeEligible: false })
  return true
}

function storageChanged(event: StorageEvent) {
  if (event.key !== null && !Object.values(VISIT_KEYS).includes(event.key as typeof VISIT_KEYS[keyof typeof VISIT_KEYS])) return
  try {
    const consent = readConsent()
    publish({ consent, browser: consent === 'accepted' ? browserRecord() : null })
    if (consent === 'accepted') void updateLocalVisit()
    else { pendingRequest?.abort(); countedLocally = false; session.countedVisitor = null; saveSession() }
  } catch { publish({ storageAvailable: false }) }
}

export const visitsStore = {
  snapshot: () => state,
  subscribe(callback: () => void) {
    if (!listeners.size) window.addEventListener('storage', storageChanged)
    listeners.add(callback)
    return () => { listeners.delete(callback); if (!listeners.size) window.removeEventListener('storage', storageChanged) }
  },
}
