import { NextRequest, NextResponse } from 'next/server'

// Given a name or URL, try to identify the source type and metadata
export async function POST(req: NextRequest) {
  const { query } = await req.json()
  if (!query) return NextResponse.json({ error: 'query required' }, { status: 400 })

  const isUrl = query.startsWith('http')

  if (isUrl) {
    // Try to detect RSS feed
    const rssProbes = [query, `${query}/feed`, `${query}/rss`, `${query}/rss.xml`, `${query}/feed.xml`]
    for (const probe of rssProbes) {
      try {
        const res = await fetch(probe, { headers: { Accept: 'application/rss+xml, application/atom+xml, text/xml' } })
        const text = await res.text()
        if (text.includes('<rss') || text.includes('<feed') || text.includes('<channel')) {
          return NextResponse.json({ type: 'rss', url: probe, name: new URL(probe).hostname })
        }
      } catch { /* try next */ }
    }
    return NextResponse.json({ type: 'web', url: query, name: new URL(query).hostname })
  }

  // Try OpenAlex journal search
  const searchUrl = `https://api.openalex.org/sources?search=${encodeURIComponent(query)}&per_page=5&mailto=john.king@leahyking.com`
  const res = await fetch(searchUrl)
  const data = await res.json()
  const results = (data.results ?? []).map((s: any) => ({
    type: 'openalex',
    openalex_id: s.id.replace('https://openalex.org/', ''),
    name: s.display_name,
    issn: s.issn_l,
    works_count: s.works_count,
  }))

  return NextResponse.json({ results })
}
