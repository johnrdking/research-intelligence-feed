import { createClient, type SupabaseClient } from '@supabase/supabase-js'

let _client: SupabaseClient | null = null
let _adminClient: SupabaseClient | null = null

// Browser-safe client for read queries from UI and server components
export function getSupabase(): SupabaseClient {
  if (!_client) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    if (!url || !anon) throw new Error('Supabase env vars not set')
    _client = createClient(url, anon)
  }
  return _client
}

// Server-only admin client with full write access
export function supabaseAdmin(): SupabaseClient {
  if (!_adminClient) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (!url || !key) throw new Error('Supabase admin env vars not set')
    _adminClient = createClient(url, key, { auth: { persistSession: false } })
  }
  return _adminClient
}

// Convenience alias — same as getSupabase() for use in server components
export const supabase = { from: (...args: Parameters<SupabaseClient['from']>) => getSupabase().from(...args) }
