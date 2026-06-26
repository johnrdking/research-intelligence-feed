import { supabaseAdmin } from './supabase'
import { fetchRecentWorks } from './openalex'
import { fetchRssFeed } from './rss'
import { analyseArticle, generateDailyDigest } from './claude'
import { sendDailyDigestEmail } from './email'

const ANALYSIS_CONCURRENCY = 5 // Claude calls in parallel

async function runInBatches<T, R>(
  items: T[],
  batchSize: number,
  fn: (item: T) => Promise<R>
): Promise<R[]> {
  const results: R[] = []
  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize)
    const batchResults = await Promise.all(batch.map(fn))
    results.push(...batchResults)
  }
  return results
}

export async function runDailyIngest(fromDate?: string): Promise<{ ingested: number; skipped: number }> {
  const db = supabaseAdmin()
  const date = fromDate ?? new Date(Date.now() - 86400000).toISOString().split('T')[0]

  const { data: sources, error } = await db.from('sources').select('*').eq('enabled', true)
  if (error) throw error

  const { data: tagRows } = await db.from('tags').select('id, name')
  const tagMap = Object.fromEntries((tagRows ?? []).map(t => [t.name, t.id]))

  // Fetch all sources in parallel
  type RawArticle = {
    id: string; title: string; abstract: string | null
    url: string; published_date: string; authors: string[]
    doi?: string | null; sourceName: string; sourceCategory: string; sourceId: string
  }

  const fetchResults = await Promise.allSettled(
    (sources ?? []).map(async source => {
      const articles: RawArticle[] = []
      if (source.type === 'openalex' && source.openalex_id) {
        const works = await fetchRecentWorks(source.openalex_id, date)
        works.forEach(w => articles.push({ ...w, sourceName: source.name, sourceCategory: source.category ?? 'industry', sourceId: source.id }))
      } else if (source.type === 'rss' && source.url) {
        const items = await fetchRssFeed(source.url, date)
        items.forEach(i => articles.push({ ...i, doi: null, sourceName: source.name, sourceCategory: source.category ?? 'industry', sourceId: source.id }))
      }
      return articles
    })
  )

  const allRaw: RawArticle[] = []
  for (const result of fetchResults) {
    if (result.status === 'fulfilled') allRaw.push(...result.value)
    else console.error('Source fetch error:', result.reason)
  }

  // Deduplicate against DB in one query
  const externalIds = allRaw.map(a => a.id).filter(Boolean)
  const { data: existing } = await db.from('articles').select('external_id').in('external_id', externalIds)
  const existingSet = new Set((existing ?? []).map(r => r.external_id))

  const newArticles = allRaw.filter(a => a.title && !existingSet.has(a.id))
  const skipped = allRaw.length - newArticles.length

  if (newArticles.length === 0) {
    console.log('[ingest] no new articles')
    return { ingested: 0, skipped }
  }

  // Analyse with Claude in parallel batches
  const analyses = await runInBatches(newArticles, ANALYSIS_CONCURRENCY, article =>
    analyseArticle(article.title, article.abstract)
  )

  // Insert all articles and collect for digest
  const ingestedArticles: Array<{
    title: string; summary: string; tags: string[]; url: string; source: string; source_type: string
  }> = []

  for (let i = 0; i < newArticles.length; i++) {
    const article  = newArticles[i]
    const analysis = analyses[i]

    const { data: inserted, error: insertErr } = await db.from('articles').insert({
      source_id:      article.sourceId,
      title:          article.title,
      abstract:       article.abstract,
      summary:        analysis.summary,
      url:            article.url,
      doi:            article.doi ?? null,
      authors:        article.authors,
      published_date: article.published_date,
      external_id:    article.id,
    }).select('id').single()

    if (insertErr || !inserted) { console.error('Insert error:', insertErr); continue }

    const tagInserts = analysis.tags.filter(t => tagMap[t]).map(t => ({ article_id: inserted.id, tag_id: tagMap[t] }))
    if (tagInserts.length > 0) await db.from('article_tags').insert(tagInserts)

    ingestedArticles.push({
      title:       article.title,
      summary:     analysis.summary,
      tags:        analysis.tags,
      url:         article.url,
      source:      article.sourceName,
      source_type: article.sourceCategory,
    })
  }

  // Generate digest
  if (ingestedArticles.length > 0) {
    const digest = await generateDailyDigest(ingestedArticles)
    const today  = new Date().toISOString().split('T')[0]

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

  return { ingested: ingestedArticles.length, skipped }
}

// Generate (or regenerate) a digest from articles already in the DB
export async function generateDigestFromExisting(): Promise<{ ok: boolean; articleCount: number }> {
  const db  = supabaseAdmin()
  const today = new Date().toISOString().split('T')[0]
  const week  = new Date(Date.now() - 7 * 86400000).toISOString().split('T')[0]

  const { data: rows } = await db
    .from('articles')
    .select('title, summary, url, sources(name, category), article_tags(tags(name))')
    .gte('ingested_at', week)
    .order('ingested_at', { ascending: false })
    .limit(50)

  if (!rows || rows.length === 0) return { ok: false, articleCount: 0 }

  const articles = rows.map((r: any) => ({
    title:       r.title,
    summary:     r.summary ?? '',
    tags:        (r.article_tags ?? []).map((at: any) => at.tags?.name).filter(Boolean),
    url:         r.url,
    source:      r.sources?.name ?? 'Unknown',
    source_type: r.sources?.category ?? 'industry',
  }))

  const digest = await generateDailyDigest(articles)

  await db.from('digests').upsert({
    date:          today,
    content:       digest.content,
    article_count: articles.length,
    top_picks:     digest.top_picks,
  }, { onConflict: 'date' })

  await sendDailyDigestEmail({
    date:         today,
    content:      digest.content,
    articleCount: articles.length,
    topPicks:     digest.top_picks,
  })

  return { ok: true, articleCount: articles.length }
}
