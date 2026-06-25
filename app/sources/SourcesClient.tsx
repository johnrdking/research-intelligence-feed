'use client'

import { useState } from 'react'

interface Source {
  id: string
  name: string
  type: string
  openalex_id: string | null
  url: string | null
  enabled: boolean
  user_added: boolean
}

interface DiscoverResult {
  type: string
  name: string
  openalex_id?: string
  url?: string
  issn?: string
  works_count?: number
}

export default function SourcesClient({ initialSources }: { initialSources: Source[] }) {
  const [sources, setSources] = useState<Source[]>(initialSources)
  const [query, setQuery] = useState('')
  const [discovering, setDiscovering] = useState(false)
  const [candidates, setCandidates] = useState<DiscoverResult[]>([])
  const [error, setError] = useState<string | null>(null)

  async function toggleSource(id: string, enabled: boolean) {
    await fetch('/api/sources', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, enabled }),
    })
    setSources(s => s.map(src => src.id === id ? { ...src, enabled } : src))
  }

  async function deleteSource(id: string) {
    await fetch(`/api/sources?id=${id}`, { method: 'DELETE' })
    setSources(s => s.filter(src => src.id !== id))
  }

  async function discover() {
    if (!query.trim()) return
    setDiscovering(true)
    setCandidates([])
    setError(null)
    try {
      const res = await fetch('/api/sources/discover', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: query.trim() }),
      })
      const data = await res.json()
      if (data.results) {
        setCandidates(data.results)
      } else if (data.type) {
        // Single match (URL input)
        setCandidates([data])
      } else {
        setError('Nothing found. Try a different name or URL.')
      }
    } catch {
      setError('Discovery failed. Check your connection.')
    } finally {
      setDiscovering(false)
    }
  }

  async function addSource(candidate: DiscoverResult) {
    const res = await fetch('/api/sources', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name:        candidate.name,
        type:        candidate.type,
        openalex_id: candidate.openalex_id ?? null,
        url:         candidate.url ?? null,
      }),
    })
    const added = await res.json()
    setSources(s => [...s, added])
    setCandidates([])
    setQuery('')
  }

  const builtIn = sources.filter(s => !s.user_added)
  const userAdded = sources.filter(s => s.user_added)

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold">Sources</h1>
        <span className="text-sm text-zinc-500">{sources.filter(s => s.enabled).length} active</span>
      </div>

      {/* Add source */}
      <div className="bg-white rounded-xl border border-zinc-200 p-5 mb-8">
        <h2 className="text-sm font-medium mb-3">Add a source</h2>
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Journal name or URL (e.g. 'Journal of Retailing' or https://...)"
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && discover()}
            className="flex-1 px-3 py-2 text-sm rounded-lg border border-zinc-200 focus:outline-none focus:ring-2 focus:ring-zinc-900/20"
          />
          <button
            onClick={discover}
            disabled={discovering}
            className="px-4 py-2 text-sm bg-zinc-900 text-white rounded-lg hover:bg-zinc-700 disabled:opacity-50 transition-colors"
          >
            {discovering ? 'Searching…' : 'Search'}
          </button>
        </div>

        {error && <p className="text-sm text-red-600 mt-2">{error}</p>}

        {candidates.length > 0 && (
          <ul className="mt-3 divide-y divide-zinc-100 border border-zinc-200 rounded-lg overflow-hidden">
            {candidates.map((c, i) => (
              <li key={i} className="flex items-center justify-between px-4 py-3 bg-white hover:bg-zinc-50">
                <div>
                  <p className="text-sm font-medium">{c.name}</p>
                  <p className="text-xs text-zinc-400">
                    {c.type === 'openalex' ? `Academic · ${c.works_count?.toLocaleString() ?? '?'} works` : c.type.toUpperCase()}
                    {c.issn ? ` · ISSN ${c.issn}` : ''}
                  </p>
                </div>
                <button
                  onClick={() => addSource(c)}
                  className="text-xs px-3 py-1 rounded-full bg-zinc-900 text-white hover:bg-zinc-700 transition-colors"
                >
                  Add
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* User-added sources */}
      {userAdded.length > 0 && (
        <SourceGroup title="Your sources" sources={userAdded} onToggle={toggleSource} onDelete={deleteSource} canDelete />
      )}

      {/* Built-in sources */}
      <SourceGroup title="Default sources" sources={builtIn} onToggle={toggleSource} canDelete={false} />
    </div>
  )
}

function SourceGroup({
  title, sources, onToggle, onDelete, canDelete,
}: {
  title: string
  sources: Source[]
  onToggle: (id: string, enabled: boolean) => void
  onDelete?: (id: string) => void
  canDelete: boolean
}) {
  return (
    <div className="mb-6">
      <h2 className="text-xs font-medium text-zinc-400 uppercase tracking-widest mb-2">{title}</h2>
      <div className="bg-white rounded-xl border border-zinc-200 divide-y divide-zinc-100 overflow-hidden">
        {sources.map(source => (
          <div key={source.id} className="flex items-center justify-between px-4 py-3">
            <div>
              <p className={`text-sm font-medium ${source.enabled ? 'text-zinc-900' : 'text-zinc-400'}`}>
                {source.name}
              </p>
              <p className="text-xs text-zinc-400 capitalize">
                {source.type}{source.url ? ` · ${source.url}` : ''}
              </p>
            </div>
            <div className="flex items-center gap-3">
              {canDelete && onDelete && (
                <button
                  onClick={() => onDelete(source.id)}
                  className="text-xs text-zinc-400 hover:text-red-500 transition-colors"
                >
                  Remove
                </button>
              )}
              <Toggle enabled={source.enabled} onChange={v => onToggle(source.id, v)} />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function Toggle({ enabled, onChange }: { enabled: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      onClick={() => onChange(!enabled)}
      className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${enabled ? 'bg-zinc-900' : 'bg-zinc-200'}`}
    >
      <span
        className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform ${enabled ? 'translate-x-4.5' : 'translate-x-0.5'}`}
      />
    </button>
  )
}
