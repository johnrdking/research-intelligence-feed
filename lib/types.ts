export interface Tag {
  name: string
  slug: string
}

export interface TopPick {
  title: string
  url: string
  reason: string
}

export interface ArticleRow {
  id: string
  title: string
  summary: string | null
  url: string
  published_date: string | null
  authors: string[] | null
  sources: { name: string; category: string | null } | null
  article_tags: Array<{ tags: Tag | null }>
}

export interface DigestRow {
  date: string
  content: string
  article_count: number
  top_picks: TopPick[] | null
}
