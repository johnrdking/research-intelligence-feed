import { NextRequest, NextResponse } from 'next/server'
import { runDailyIngest } from '@/lib/pipeline'

// Manual trigger endpoint — useful for testing and backfilling
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}))
  const result = await runDailyIngest(body.fromDate)
  return NextResponse.json(result)
}
