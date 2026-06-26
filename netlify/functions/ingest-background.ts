import type { Handler } from '@netlify/functions'
import { runDailyIngest } from '../../lib/pipeline'

// Netlify v1 background function — responds 202 immediately, runs up to 15 minutes
const handler: Handler = async event => {
  try {
    const body = event.body ? JSON.parse(event.body) : {}
    const result = await runDailyIngest(body.fromDate)
    console.log(`[ingest-background] done — ingested: ${result.ingested}, skipped: ${result.skipped}`)
  } catch (err) {
    console.error('[ingest-background] failed:', err)
  }
  return { statusCode: 200 }
}

export { handler }
