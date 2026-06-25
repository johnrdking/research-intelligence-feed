import Anthropic from '@anthropic-ai/sdk'
import type { TopPick } from './types'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

const TAGS = [
  'Consumer Behaviour',
  'Digital Marketing',
  'Advertising',
  'Influencer Marketing',
  'Pricing',
  'Brand Management',
  'AI & Technology',
  'Data & Privacy',
  'Platform Economics',
  'Customer Experience & Loyalty',
  'Behavioural Economics',
  'Innovation & Product Strategy',
  'B2B Marketing',
  'Market Research & Methods',
  'Social & Cultural Trends',
]

export interface ArticleAnalysis {
  summary: string     // 2-sentence plain-English summary
  tags: string[]      // 1–3 tags from the TAGS list
}

export async function analyseArticle(
  title: string,
  abstract: string | null
): Promise<ArticleAnalysis> {
  const content = abstract
    ? `Title: ${title}\n\nAbstract: ${abstract}`
    : `Title: ${title}`

  const message = await client.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 300,
    messages: [{
      role: 'user',
      content: `You are tagging academic and practitioner marketing articles for a professional digest.

Given the article below, return a JSON object with:
- "summary": a 2-sentence plain-English summary accessible to a senior marketing professional (not academic jargon)
- "tags": an array of 1–3 tags chosen ONLY from this list: ${JSON.stringify(TAGS)}

Article:
${content}

Respond with valid JSON only. No markdown, no explanation.`,
    }],
  })

  const raw = (message.content[0] as any).text.trim()
  try {
    const parsed = JSON.parse(raw)
    return {
      summary: parsed.summary ?? '',
      tags: (parsed.tags ?? []).filter((t: string) => TAGS.includes(t)).slice(0, 3),
    }
  } catch {
    return { summary: '', tags: [] }
  }
}

export interface DigestOutput {
  content: string
  top_picks: TopPick[]
}

export async function generateDailyDigest(
  articles: Array<{ title: string; summary: string; tags: string[]; url: string; source: string; source_type?: string }>
): Promise<DigestOutput> {
  if (articles.length === 0) {
    return { content: 'No new articles today.', top_picks: [] }
  }

  const articleList = articles
    .map((a, i) => `[${i}] [${a.source_type ?? a.source}] **${a.title}** (${a.url})\n  Tags: ${a.tags.join(', ')}\n  ${a.summary}`)
    .join('\n\n')

  const message = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 2000,
    messages: [{
      role: 'user',
      content: `You are writing a daily research digest for a senior professional who wants to stay current on marketing, consumer psychology, behavioural economics, sales effectiveness, and business strategy.

Below are today's new articles (academic papers weighted higher). Return a JSON object with two fields:

"content": A Markdown digest that:
1. Opens with a 2–3 sentence "Today's themes" overview
2. Groups articles under their primary tags as ## headings
3. For each article: one sentence on the key takeaway — add a practical connecting insight, not a restatement
4. Tone: intelligent, direct. No jargon. No fluff. Academic sources should be flagged with [Academic].

"top_picks": An array of 2–3 objects, each with:
- "title": exact article title
- "url": exact article URL from the list
- "reason": one sentence on why this is the most practically valuable item today

Respond with valid JSON only. No markdown fences.

Articles:
${articleList}`,
    }],
  })

  const raw = (message.content[0] as any).text.trim()
  try {
    const parsed = JSON.parse(raw)
    return {
      content: parsed.content ?? '',
      top_picks: Array.isArray(parsed.top_picks) ? parsed.top_picks.slice(0, 3) : [],
    }
  } catch {
    // Fallback: treat whole response as content with no picks
    return { content: raw, top_picks: [] }
  }
}
