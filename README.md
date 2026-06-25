# Research Intelligence Feed

Daily digest of academic papers and practitioner articles across marketing, consumer psychology, behavioural economics, sales effectiveness, and business strategy. Runs automatically every morning via Netlify scheduled functions, lands in your inbox, and is browsable via a web dashboard.

---

## What it does

- **Pulls from 23 sources** — academic journals via [OpenAlex](https://openalex.org) (Journal of Marketing, Journal of Consumer Psychology, Psychological Science, etc.) plus practitioner and industry RSS feeds (McKinsey, The Behavioral Scientist, Strategy+Business, etc.)
- **Analyses each article** with Claude: 2-sentence plain-English summary, 1–3 topic tags
- **Generates a daily digest** with Claude: thematic overview, grouped articles with connecting insights, 2–3 top picks
- **Emails the digest** to your inbox every morning (via Resend)
- **Dashboard** to browse and search everything by tag, source, or date

---

## Setup

### 1. Supabase (database)

1. Create a free project at [supabase.com](https://supabase.com)
2. Go to **SQL Editor** and run the contents of `supabase/schema.sql` — this creates the tables and seeds all 23 sources
3. Copy your **Project URL**, **anon key**, and **service_role key** from Project Settings → API

### 2. Anthropic API key

Create a key at [console.anthropic.com/settings/keys](https://console.anthropic.com/settings/keys). The pipeline uses `claude-haiku-4-5` for per-article tagging and `claude-sonnet-4-6` for the daily digest.

### 3. Resend (email)

1. Create a free account at [resend.com](https://resend.com) (3,000 emails/month free)
2. For **testing**: use `onboarding@resend.dev` as the from address — no domain setup needed
3. For **production**: add and verify your own domain in the Resend dashboard, then set `RESEND_FROM=Research Digest <digest@yourdomain.com>`
4. Copy your API key

### 4. Local setup

```bash
cp .env.local.example .env.local
# fill in your values
npm install
npm run dev
```

Visit `http://localhost:3000`. The dashboard will show "No digest yet" until you run the ingest.

### 5. Trigger a manual ingest

```bash
curl -X POST http://localhost:3000/api/ingest \
  -H "Content-Type: application/json" \
  -d '{"fromDate":"2026-06-18"}'
```

This pulls the last week of articles, analyses them, generates the digest, and sends the email.

### 6. Deploy to Netlify (for automatic scheduling)

1. Push this folder to a GitHub repo
2. Connect it to a new Netlify site
3. Set all env vars in Netlify → Site configuration → Environment variables
4. Deploy — Netlify will automatically schedule `netlify/functions/daily-ingest.ts` to run at **6:00 AM UTC** every day

---

## Adding more sources

Go to `/sources` in the dashboard:

- **Paste a journal name** (e.g. "Journal of Sales Management") → searches OpenAlex → add with one click
- **Paste an RSS/website URL** → auto-detects feed → add with one click

The pipeline will pick up any new enabled source on the next run.

Recommended additions to search for:
- Journal of Sales Management
- Journal of Personal Selling & Sales Management
- Psychology & Marketing
- Frontiers in Psychology (Consumer Psychology section)
- Deloitte Insights (paste their RSS URL)

---

## Source categories

Sources are labelled in the UI:

| Badge | Meaning |
|-------|---------|
| **Academic** | Peer-reviewed journal via OpenAlex |
| **Practitioner** | McKinsey, HBR, MIT Sloan, Strategy+Business, The Behavioral Scientist |
| **Industry** | Marketing Week, Think with Google, MarketingProfs |

Academic sources are flagged `[Academic]` in the Claude-generated digest to help you weight them appropriately.

---

## Project structure

```
app/
  page.tsx          — homepage (today's digest + articles)
  browse/           — searchable archive by tag/keyword
  sources/          — manage sources
  api/ingest/       — manual trigger endpoint
components/
  DigestView.tsx    — digest view with Top Picks section
  ArticleCard.tsx   — article card with category badge
lib/
  pipeline.ts       — main ingest orchestrator
  openalex.ts       — academic paper fetcher
  rss.ts            — RSS feed parser
  claude.ts         — Claude analysis + digest generation
  email.ts          — Resend email delivery
  types.ts          — shared TypeScript types
netlify/functions/
  daily-ingest.ts   — scheduled Netlify function (6am UTC daily)
supabase/
  schema.sql        — full schema + seed data
```
