import type { TopPick } from './types'

const RESEND_API_KEY = process.env.RESEND_API_KEY
const RESEND_FROM    = process.env.RESEND_FROM ?? 'Research Digest <onboarding@resend.dev>'
const DIGEST_TO      = process.env.DIGEST_EMAIL ?? 'john.king@leahyking.com'
const SITE_URL       = process.env.NEXT_PUBLIC_SITE_URL ?? ''

function markdownToHtml(md: string): string {
  const lines = md.split('\n')
  const out: string[] = []
  let inList = false

  for (const raw of lines) {
    const line = raw
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2" style="color:#2563eb">$1</a>')

    if (line.startsWith('## ')) {
      if (inList) { out.push('</ul>'); inList = false }
      out.push(`<h2 style="margin:28px 0 6px;font-size:15px;font-weight:700;color:#18181b;text-transform:uppercase;letter-spacing:0.04em">${line.slice(3)}</h2>`)
    } else if (line.startsWith('# ')) {
      if (inList) { out.push('</ul>'); inList = false }
      out.push(`<h1 style="margin:24px 0 8px;font-size:18px;font-weight:700;color:#18181b">${line.slice(2)}</h1>`)
    } else if (line.startsWith('- ') || line.startsWith('* ')) {
      if (!inList) { out.push('<ul style="margin:4px 0 12px;padding-left:20px">'); inList = true }
      out.push(`<li style="margin-bottom:5px;color:#374151;font-size:14px;line-height:1.6">${line.slice(2)}</li>`)
    } else if (line.trim() === '') {
      if (inList) { out.push('</ul>'); inList = false }
      out.push('<div style="height:8px"></div>')
    } else {
      if (inList) { out.push('</ul>'); inList = false }
      out.push(`<p style="margin:0 0 10px;color:#374151;font-size:14px;line-height:1.7">${line}</p>`)
    }
  }
  if (inList) out.push('</ul>')
  return out.join('\n')
}

function buildTopPicksHtml(picks: TopPick[]): string {
  if (!picks.length) return ''
  const items = picks.map(p => `
    <div style="margin-bottom:16px;padding-bottom:16px;border-bottom:1px solid #dbeafe">
      <a href="${p.url}" style="font-size:14px;font-weight:600;color:#1e40af;text-decoration:none;display:block;margin-bottom:3px">${p.title}</a>
      <p style="margin:0;font-size:13px;color:#374151;line-height:1.5">${p.reason}</p>
    </div>`).join('')

  return `
    <div style="background:#eff6ff;border-left:4px solid #3b82f6;padding:20px 24px;margin-bottom:28px;border-radius:0 10px 10px 0">
      <h3 style="margin:0 0 16px;font-size:12px;font-weight:700;color:#1e40af;text-transform:uppercase;letter-spacing:0.08em">Worth Your Time Today</h3>
      ${items}
    </div>`
}

export async function sendDailyDigestEmail(params: {
  date: string
  content: string
  articleCount: number
  topPicks: TopPick[]
}): Promise<void> {
  if (!RESEND_API_KEY) {
    console.log('[email] RESEND_API_KEY not configured — skipping email delivery')
    return
  }

  const d = new Date(params.date)
  const formattedDate = d.toLocaleDateString('en-GB', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  })
  const formattedDateShort = d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })

  const dashboardLink = SITE_URL
    ? `<a href="${SITE_URL}" style="color:#6b7280;text-decoration:underline">Open dashboard</a>`
    : ''

  const html = `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif">
  <div style="max-width:620px;margin:0 auto;padding:32px 16px">

    <!-- Header -->
    <div style="background:#18181b;border-radius:12px 12px 0 0;padding:28px 32px">
      <p style="margin:0 0 4px;font-size:12px;font-weight:600;color:#a1a1aa;text-transform:uppercase;letter-spacing:0.08em">Research Intelligence Feed</p>
      <h1 style="margin:0;font-size:22px;font-weight:700;color:#ffffff">${formattedDate}</h1>
      <p style="margin:8px 0 0;font-size:13px;color:#71717a">${params.articleCount} new items ingested</p>
    </div>

    <!-- Body -->
    <div style="background:#ffffff;padding:32px;border-left:1px solid #e4e4e7;border-right:1px solid #e4e4e7">
      ${buildTopPicksHtml(params.topPicks)}
      <div style="color:#374151">
        ${markdownToHtml(params.content)}
      </div>
    </div>

    <!-- Footer -->
    <div style="background:#f9f9f9;border:1px solid #e4e4e7;border-top:none;border-radius:0 0 12px 12px;padding:16px 32px;text-align:center">
      <p style="margin:0;font-size:12px;color:#a1a1aa">
        ${dashboardLink}
        ${dashboardLink ? ' · ' : ''}
        Research Intelligence Feed · ${formattedDateShort}
      </p>
    </div>

  </div>
</body>
</html>`

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: RESEND_FROM,
      to: [DIGEST_TO],
      subject: `Research Digest — ${formattedDate}`,
      html,
    }),
  })

  if (!res.ok) {
    const body = await res.text()
    console.error('[email] Resend error:', res.status, body)
  } else {
    console.log('[email] Digest sent to', DIGEST_TO)
  }
}
