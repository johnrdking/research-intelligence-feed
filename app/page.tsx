import { supabase } from '@/lib/supabase'
import type { ArticleRow, DigestRow } from '@/lib/types'
import DigestView from '@/components/DigestView'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default async function HomePage() {
  const { data: digest } = await supabase
    .from('digests')
    .select('date, content, article_count, top_picks')
    .order('date', { ascending: false })
    .limit(1)
    .single()

  const { data: articles } = await supabase
    .from('articles')
    .select(`
      id, title, summary, url, published_date, authors,
      sources ( name, category ),
      article_tags ( tags ( name, slug ) )
    `)
    .order('ingested_at', { ascending: false })
    .limit(30)

  const hasData = digest || (articles && articles.length > 0)

  if (!hasData) {
    return (
      <div className="text-center py-20 text-zinc-500">
        <p className="text-lg font-medium mb-2">No digest yet</p>
        <p className="text-sm">
          Run the ingest pipeline to pull today&apos;s articles, or{' '}
          <Link href="/sources" className="text-zinc-800 underline underline-offset-2">
            check your sources
          </Link>
          .
        </p>
      </div>
    )
  }

  return (
    <DigestView
      digest={digest as DigestRow | null}
      articles={(articles ?? []) as unknown as ArticleRow[]}
    />
  )
}
