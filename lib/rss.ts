import Parser from 'rss-parser'

const parser = new Parser()

export interface RssArticle {
  id: string        // feed item GUID or link
  title: string
  abstract: string | null
  url: string
  published_date: string
  authors: string[]
}

export async function fetchRssFeed(feedUrl: string, fromDate: string): Promise<RssArticle[]> {
  const feed = await parser.parseURL(feedUrl)
  const cutoff = new Date(fromDate)

  return (feed.items ?? [])
    .filter(item => {
      const d = item.pubDate ? new Date(item.pubDate) : null
      return d && d >= cutoff
    })
    .map(item => ({
      id: item.guid ?? item.link ?? item.title ?? '',
      title: item.title ?? '(no title)',
      abstract: item.contentSnippet ?? item.summary ?? null,
      url: item.link ?? '',
      published_date: item.pubDate
        ? new Date(item.pubDate).toISOString().split('T')[0]
        : new Date().toISOString().split('T')[0],
      authors: item.creator ? [item.creator] : [],
    }))
}
