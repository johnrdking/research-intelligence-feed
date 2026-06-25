import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '(not set)'
  const hasServiceKey = !!process.env.SUPABASE_SERVICE_ROLE_KEY
  const hasAnonKey    = !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  const hasAnthropicKey = !!process.env.ANTHROPIC_API_KEY

  // Trim any accidental whitespace/slash from URL
  const cleanUrl = url.trim().replace(/\/$/, '')
  const urlMismatch = cleanUrl !== url

  let dbStatus = 'untested'
  let dbError: string | null = null

  try {
    const db = supabaseAdmin()
    const { count, error } = await db.from('sources').select('*', { count: 'exact', head: true })
    if (error) {
      dbStatus = 'error'
      dbError = JSON.stringify(error)
    } else {
      dbStatus = `ok — ${count} sources`
    }
  } catch (err) {
    dbStatus = 'error'
    dbError = err instanceof Error ? err.message : String(err)
  }

  return NextResponse.json({
    supabaseUrl: cleanUrl,
    urlHasTrailingSlashOrWhitespace: urlMismatch,
    hasServiceKey,
    hasAnonKey,
    hasAnthropicKey,
    db: dbStatus,
    dbError,
  })
}
