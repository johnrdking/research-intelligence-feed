'use client'

import { useState } from 'react'
import type { ArticleRow, DigestRow, TopPick } from '@/lib/types'
import ArticleCard from './ArticleCard'

interface Props {
  digest: DigestRow | null
  articles: ArticleRow[]
}

export default function DigestView({ digest, articles }: Props) {
  const [view, setView] = useState<'digest' | 'articles'>('digest')

  const formattedDate = digest?.date
    ? new Date(digest.date).toLocaleDateString('en-GB', {
        weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
      })
    : null

  const picks: TopPick[] = digest?.top_picks ?? []

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold">Daily Digest</h1>
          {formattedDate && <p className="text-sm text-zinc-500 mt-0.5">{formattedDate}</p>}
        </div>
        <div className="flex rounded-lg border border-zinc-200 overflow-hidden text-sm">
          <button
            onClick={() => setView('digest')}
            className={`px-4 py-1.5 transition-colors ${view === 'digest' ? 'bg-zinc-900 text-white' : 'bg-white text-zinc-600 hover:bg-zinc-50'}`}
          >
            Summary
          </button>
          <button
            onClick={() => setView('articles')}
            className={`px-4 py-1.5 transition-colors ${view === 'articles' ? 'bg-zinc-900 text-white' : 'bg-white text-zinc-600 hover:bg-zinc-50'}`}
          >
            Articles ({articles.length})
          </button>
        </div>
      </div>

      {view === 'digest' && digest && (
        <div className="space-y-4">
          {picks.length > 0 && (
            <div className="rounded-xl border border-blue-200 bg-blue-50 p-5">
              <p className="text-xs font-semibold text-blue-700 uppercase tracking-widest mb-3">
                Worth Your Time Today
              </p>
              <div className="space-y-3">
                {picks.map((pick, i) => (
                  <div key={i} className="flex gap-3">
                    <span className="shrink-0 mt-0.5 text-xs font-bold text-blue-400 w-4">{i + 1}</span>
                    <div>
                      <a
                        href={pick.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm font-semibold text-blue-900 hover:underline underline-offset-2 leading-snug"
                      >
                        {pick.title}
                      </a>
                      <p className="text-xs text-zinc-600 mt-0.5 leading-relaxed">{pick.reason}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="prose prose-zinc prose-sm max-w-none bg-white rounded-xl border border-zinc-200 p-6">
            <MarkdownContent content={digest.content} />
          </div>
        </div>
      )}

      {view === 'articles' && (
        <div className="space-y-4">
          {articles.map(article => (
            <ArticleCard key={article.id} article={article} />
          ))}
        </div>
      )}
    </div>
  )
}

function MarkdownContent({ content }: { content: string }) {
  const lines = content.split('\n')
  const elements: React.ReactNode[] = []
  let i = 0

  while (i < lines.length) {
    const line = lines[i]

    if (line.startsWith('## ')) {
      elements.push(
        <h2 key={i} className="text-base font-semibold mt-5 mb-2 text-zinc-800">
          {line.slice(3)}
        </h2>
      )
    } else if (line.startsWith('# ')) {
      elements.push(
        <h1 key={i} className="text-lg font-semibold mt-4 mb-2 text-zinc-900">
          {line.slice(2)}
        </h1>
      )
    } else if (line.startsWith('- ') || line.startsWith('* ')) {
      elements.push(
        <li
          key={i}
          className="ml-4 text-zinc-700 leading-relaxed list-disc"
          dangerouslySetInnerHTML={{ __html: renderInline(line.slice(2)) }}
        />
      )
    } else if (line.trim() === '') {
      elements.push(<div key={i} className="h-2" />)
    } else {
      elements.push(
        <p
          key={i}
          className="text-zinc-700 leading-relaxed"
          dangerouslySetInnerHTML={{ __html: renderInline(line) }}
        />
      )
    }
    i++
  }

  return <>{elements}</>
}

function renderInline(text: string): string {
  return text
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(
      /\[(.+?)\]\((.+?)\)/g,
      '<a href="$2" target="_blank" rel="noopener noreferrer" class="underline underline-offset-2 text-zinc-900">$1</a>'
    )
}
