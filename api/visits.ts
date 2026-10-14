import { handleVisits } from '../server/visits.ts'

// Web-standard route exports let Vercel load this endpoint without a framework adapter.
// Secrets remain inside the server-side handler.
export const GET = handleVisits
export const POST = handleVisits
