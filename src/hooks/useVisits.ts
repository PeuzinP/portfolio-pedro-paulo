import { useEffect, useSyncExternalStore } from 'react'
import { startVisits, visitsStore } from '../lib/visits'

export function useVisits() {
  const state = useSyncExternalStore(visitsStore.subscribe, visitsStore.snapshot, visitsStore.snapshot)
  useEffect(() => { void startVisits() }, [])
  return state
}
