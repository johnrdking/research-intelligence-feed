import type { Config } from '@netlify/functions'
import { runDailyIngest } from '../../lib/pipeline'

// Background function — responds 202 immediately, runs for up to 15 minutes
export default async function handler(req: Request) {
  const body = await req.json().catch(() => ({}))
  const fromDate: string | undefined = body.fromDate

  try {
    const result = await runDailyIngest(fromDate)
    console.log(`[ingest-background] complete: ${result.ingested} ingested, ${result.skipped} skipped`)
  } catch (err) {
    console.error('[ingest-background] failed:', err)
  }
}

export const config: Config = {
  path: '/api/ingest-bg',
}
