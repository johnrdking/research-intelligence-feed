import { supabase } from '@/lib/supabase'
import type { ArticleRow } from '@/lib/types'
import BrowseClient from './BrowseClient'

export const dynamic = 'force-dynamic'

export default async function BrowsePage({
  searchParams,
}: {
  searchParams: Promise<{ tag?: string; q?: string }>
}) {
  const { tag, q } = await searchParams

  // Load all tags for the filter bar
  const { data: tags } = await supabase
    .from('tags')
    .select('name, slug')
    .order('name')

  // Build article query
  let query = supabase
    .from('articles')
    .select(`
      id, title, summary, url, published_date, authors,
      sources ( name, category ),
      article_tags ( tags ( name, slug ) )
    `)
    .order('published_date', { ascending: false })
    .limit(50)

  if (q) {
    query = query.ilike('title', `%${q}%`)
  }

  const { data: articles } = await query

  // Filter by tag client-side (simpler than a subquery for MVP)
  const filtered = tag
    ? (articles ?? []).filter(a =>
        a.article_tags.some((at: any) => at.tags?.slug === tag)
      )
    : (articles ?? [])

  return (
    <BrowseClient
      articles={filtered as unknown as ArticleRow[]}
      tags={tags ?? []}
      activeTag={tag ?? null}
      searchQuery={q ?? ''}
    />
  )
}
