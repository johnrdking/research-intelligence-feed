import { NextRequest, NextResponse } from 'next/server'
import { runDailyIngest } from '@/lib/pipeline'

// Manual trigger endpoint — useful for testing and backfilling
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}))
    const result = await runDailyIngest(body.fromDate)
    return NextResponse.json(result)
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.error('[ingest] error:', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
