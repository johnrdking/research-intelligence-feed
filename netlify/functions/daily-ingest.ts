import type { Config } from '@netlify/functions'
import { runDailyIngest } from '../../lib/pipeline'

export default async function handler() {
  try {
    const result = await runDailyIngest()
    console.log(`Ingest complete: ${result.ingested} new, ${result.skipped} skipped`)
    return new Response(JSON.stringify(result), { status: 200 })
  } catch (err) {
    console.error('Ingest failed:', err)
    return new Response(JSON.stringify({ error: String(err) }), { status: 500 })
  }
}

// Runs at 6:00 AM UTC every day
export const config: Config = {
  schedule: '0 6 * * *',
}
