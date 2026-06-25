'use client'

import { useRouter, usePathname } from 'next/navigation'
import { useState, useTransition } from 'react'
import type { ArticleRow, Tag } from '@/lib/types'
import ArticleCard from '@/components/ArticleCard'

interface Props {
  articles: ArticleRow[]
  tags: Tag[]
  activeTag: string | null
  searchQuery: string
}

export default function BrowseClient({ articles, tags, activeTag, searchQuery }: Props) {
  const router = useRouter()
  const pathname = usePathname()
  const [, startTransition] = useTransition()
  const [search, setSearch] = useState(searchQuery)

  function navigate(newTag: string | null, newSearch?: string) {
    const params = new URLSearchParams()
    if (newTag)    params.set('tag', newTag)
    if (newSearch) params.set('q', newSearch)
    const qs = params.toString()
    startTransition(() => router.push(qs ? `${pathname}?${qs}` : pathname))
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold mb-6">Browse Articles</h1>

      {/* Search */}
      <input
        type="text"
        placeholder="Search titles..."
        value={search}
        onChange={e => setSearch(e.target.value)}
        onKeyDown={e => e.key === 'Enter' && navigate(activeTag, search)}
        className="w-full mb-4 px-4 py-2 rounded-lg border border-zinc-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900/20"
      />

      {/* Tag filter */}
      <div className="flex flex-wrap gap-2 mb-6">
        <button
          onClick={() => navigate(null, search)}
          className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
            !activeTag ? 'bg-zinc-900 text-white border-zinc-900' : 'bg-white text-zinc-600 border-zinc-200 hover:border-zinc-300'
          }`}
        >
          All
        </button>
        {tags.map(tag => (
          <button
            key={tag.slug}
            onClick={() => navigate(tag.slug, search)}
            className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
              activeTag === tag.slug ? 'bg-zinc-900 text-white border-zinc-900' : 'bg-white text-zinc-600 border-zinc-200 hover:border-zinc-300'
            }`}
          >
            {tag.name}
          </button>
        ))}
      </div>

      {/* Results */}
      {articles.length === 0 ? (
        <p className="text-zinc-500 text-sm text-center py-12">No articles found.</p>
      ) : (
        <div className="space-y-4">
          <p className="text-xs text-zinc-400">{articles.length} article{articles.length !== 1 ? 's' : ''}</p>
          {articles.map(article => (
            <ArticleCard key={article.id} article={article} />
          ))}
        </div>
      )}
    </div>
  )
}
