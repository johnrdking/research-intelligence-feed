import type { ArticleRow, Tag } from '@/lib/types'

const CATEGORY_STYLES: Record<string, string> = {
  academic:      'bg-indigo-50 text-indigo-700 border-indigo-200',
  practitioner:  'bg-emerald-50 text-emerald-700 border-emerald-200',
  industry:      'bg-amber-50 text-amber-700 border-amber-200',
}

const CATEGORY_LABEL: Record<string, string> = {
  academic:      'Academic',
  practitioner:  'Practitioner',
  industry:      'Industry',
}

export default function ArticleCard({ article }: { article: ArticleRow }) {
  const tags = article.article_tags
    .map(at => at.tags)
    .filter(Boolean) as Tag[]

  const authors = article.authors ?? []
  const authorsDisplay =
    authors.slice(0, 3).join(', ') + (authors.length > 3 ? ` +${authors.length - 3}` : '')

  const category = article.sources?.category ?? 'industry'

  return (
    <div className="bg-white rounded-xl border border-zinc-200 p-5 hover:border-zinc-300 transition-colors">
      <div className="flex items-start justify-between gap-4 mb-2">
        <a
          href={article.url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-base font-medium text-zinc-900 hover:underline underline-offset-2 leading-snug"
        >
          {article.title}
        </a>
        <span
          className={`shrink-0 text-xs font-semibold px-2 py-0.5 rounded border ${CATEGORY_STYLES[category] ?? CATEGORY_STYLES.industry}`}
        >
          {CATEGORY_LABEL[category] ?? 'Industry'}
        </span>
      </div>

      {article.summary && (
        <p className="text-sm text-zinc-600 leading-relaxed mb-3">{article.summary}</p>
      )}

      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex flex-wrap gap-1.5">
          {tags.map(tag => (
            <a
              key={tag.slug}
              href={`/browse?tag=${tag.slug}`}
              className="text-xs px-2 py-0.5 rounded-full bg-zinc-100 text-zinc-600 hover:bg-zinc-200 transition-colors"
            >
              {tag.name}
            </a>
          ))}
        </div>
        <div className="text-xs text-zinc-400 shrink-0">
          {article.sources?.name && <span className="mr-2">{article.sources.name}</span>}
          {article.published_date && (
            <span>
              {new Date(article.published_date).toLocaleDateString('en-GB', {
                day: 'numeric', month: 'short', year: 'numeric',
              })}
            </span>
          )}
        </div>
      </div>

      {authorsDisplay && (
        <p className="text-xs text-zinc-400 mt-1.5">{authorsDisplay}</p>
      )}
    </div>
  )
}
