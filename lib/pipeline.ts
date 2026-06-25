import { supabaseAdmin } from './supabase'
import { fetchRecentWorks } from './openalex'
import { fetchRssFeed } from './rss'
import { analyseArticle, generateDailyDigest } from './claude'
import { sendDailyDigestEmail } from './email'

export async function runDailyIngest(fromDate?: string): Promise<{ ingested: number; skipped: number }> {
  const db = supabaseAdmin()
  const date = fromDate ?? new Date(Date.now() - 86400000).toISOString().split('T')[0] // yesterday

  // Load all enabled sources (include category for source-type labelling)
  const { data: sources, error } = await db.from('sources').select('*').eq('enabled', true)
  if (error) throw error

  // Load all tags into a name → id map
  const { data: tagRows } = await db.from('tags').select('id, name')
  const tagMap = Object.fromEntries((tagRows ?? []).map(t => [t.name, t.id]))

  let ingested = 0
  let skipped = 0
  const ingestedArticles: Array<{
    title: string
    summary: string
    tags: string[]
    url: string
    source: string
    source_type: string
  }> = []

  for (const source of sources ?? []) {
    let rawArticles: Array<{
      id: string; title: string; abstract: string | null;
      url: string; published_date: string; authors: string[]
      doi?: string | null
    }> = []

    try {
      if (source.type === 'openalex' && source.openalex_id) {
        rawArticles = await fetchRecentWorks(source.openalex_id, date)
      } else if (source.type === 'rss' && source.url) {
        rawArticles = await fetchRssFeed(source.url, date)
      }
    } catch (err) {
      console.error(`Failed to fetch source ${source.name}:`, err)
      continue
    }

    for (const article of rawArticles) {
      // Skip if already ingested
      const { data: existing } = await db
        .from('articles')
        .select('id')
        .eq('external_id', article.id)
        .single()

      if (existing) { skipped++; continue }
      if (!article.title) { skipped++; continue }

      const analysis = await analyseArticle(article.title, article.abstract)

      const { data: inserted, error: insertErr } = await db
        .from('articles')
        .insert({
          source_id:      source.id,
          title:          article.title,
          abstract:       article.abstract,
          summary:        analysis.summary,
          url:            article.url,
          doi:            article.doi ?? null,
          authors:        article.authors,
          published_date: article.published_date,
          external_id:    article.id,
        })
        .select('id')
        .single()

      if (insertErr || !inserted) {
        console.error('Insert error:', insertErr)
        continue
      }

      // Attach tags
      const tagInserts = analysis.tags
        .filter(t => tagMap[t])
        .map(t => ({ article_id: inserted.id, tag_id: tagMap[t] }))

      if (tagInserts.length > 0) {
        await db.from('article_tags').insert(tagInserts)
      }

      ingestedArticles.push({
        title:       article.title,
        summary:     analysis.summary,
        tags:        analysis.tags,
        url:         article.url,
        source:      source.name,
        source_type: source.category ?? 'industry',
      })
      ingested++
    }
  }

  // Generate digest and send email if anything was ingested
  if (ingestedArticles.length > 0) {
    const digest = await generateDailyDigest(ingestedArticles)
    const today = new Date().toISOString().split('T')[0]

    await db.from('digests').upsert({
      date:          today,
      content:       digest.content,
      article_count: ingestedArticles.length,
      top_picks:     digest.top_picks,
    }, { onConflict: 'date' })

    await sendDailyDigestEmail({
      date:         today,
      content:      digest.content,
      articleCount: ingestedArticles.length,
      topPicks:     digest.top_picks,
    })
  }

  return { ingested, skipped }
}
