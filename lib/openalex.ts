const BASE = 'https://api.openalex.org'
const EMAIL = 'john.king@leahyking.com' // polite-pool identifier

export interface OpenAlexWork {
  id: string
  title: string
  abstract: string | null
  doi: string | null
  url: string
  authors: string[]
  published_date: string
  source_name: string
}

function reconstructAbstract(inverted: Record<string, number[]> | null): string | null {
  if (!inverted) return null
  const words: string[] = []
  for (const [word, positions] of Object.entries(inverted)) {
    for (const pos of positions) words[pos] = word
  }
  return words.join(' ')
}

export async function fetchRecentWorks(
  openalexSourceId: string,
  fromDate: string   // YYYY-MM-DD
): Promise<OpenAlexWork[]> {
  const params = new URLSearchParams({
    filter: `primary_location.source.id:${openalexSourceId},from_publication_date:${fromDate}`,
    sort: 'publication_date:desc',
    per_page: '50',
    select: 'id,title,doi,primary_location,authorships,publication_date,abstract_inverted_index',
    mailto: EMAIL,
  })

  const res = await fetch(`${BASE}/works?${params}`)
  if (!res.ok) throw new Error(`OpenAlex error ${res.status} for source ${openalexSourceId}`)

  const data = await res.json()

  return (data.results ?? []).map((w: any) => ({
    id: w.id,
    title: w.title ?? '(no title)',
    abstract: reconstructAbstract(w.abstract_inverted_index),
    doi: w.doi ?? null,
    url: w.doi ? `https://doi.org/${w.doi.replace('https://doi.org/', '')}` : w.id,
    authors: (w.authorships ?? [])
      .slice(0, 5)
      .map((a: any) => a.author?.display_name)
      .filter(Boolean),
    published_date: w.publication_date,
    source_name: w.primary_location?.source?.display_name ?? 'Unknown',
  }))
}
