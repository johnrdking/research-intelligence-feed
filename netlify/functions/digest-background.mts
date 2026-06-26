import type { Config } from '@netlify/functions'
import { generateDigestFromExisting } from '../../lib/pipeline'

// Background function — responds 202 immediately, generates digest in background
export default async function handler() {
  try {
    const result = await generateDigestFromExisting()
    console.log(`[digest-background] done: ${result.articleCount} articles, ok=${result.ok}`)
  } catch (err) {
    console.error('[digest-background] failed:', err)
  }
}

export const config: Config = {
  path: '/api/digest-bg',
}
