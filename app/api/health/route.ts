import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '(not set)'
  const hasServiceKey   = !!process.env.SUPABASE_SERVICE_ROLE_KEY
  const hasAnonKey      = !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  const hasAnthropicKey = !!process.env.ANTHROPIC_API_KEY
  const hasResendKey    = !!process.env.RESEND_API_KEY

  const cleanUrl = url.trim().replace(/\/$/, '')

  let sourcesCount: number | null = null
  let articlesCount: number | null = null
  let digestsCount: number | null = null
  let dbError: string | null = null

  try {
    const db = supabaseAdmin()
    const [s, a, d] = await Promise.all([
      db.from('sources').select('*', { count: 'exact', head: true }),
      db.from('articles').select('*', { count: 'exact', head: true }),
      db.from('digests').select('*', { count: 'exact', head: true }),
    ])
    if (s.error) throw s.error
    sourcesCount  = s.count
    articlesCount = a.count
    digestsCount  = d.count
  } catch (err) {
    dbError = err instanceof Error ? err.message : JSON.stringify(err)
  }

  return NextResponse.json({
    supabaseUrl: cleanUrl,
    keys: { service: hasServiceKey, anon: hasAnonKey, anthropic: hasAnthropicKey, resend: hasResendKey },
    db: dbError ?? 'ok',
    sources:  sourcesCount,
    articles: articlesCount,
    digests:  digestsCount,
  })
}
