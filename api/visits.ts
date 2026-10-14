import { handleVisits } from '../server/visits.ts'

// Vercel Node.js Web Standard handler; secrets remain in this server boundary.
export default { fetch: handleVisits }
