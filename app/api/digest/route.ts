import { NextResponse } from 'next/server'
import { generateDigestFromExisting } from '@/lib/pipeline'

// Generates a digest from articles already in the DB — useful when ingest
// ran but timed out before reaching the digest step
export async function POST() {
  try {
    const result = await generateDigestFromExisting()
    if (!result.ok) {
      return NextResponse.json({ error: 'No articles found in the last 7 days' }, { status: 404 })
    }
    return NextResponse.json(result)
  } catch (err) {
    const message = err instanceof Error ? err.message : JSON.stringify(err)
    console.error('[digest] error:', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
