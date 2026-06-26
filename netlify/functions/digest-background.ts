import type { Handler } from '@netlify/functions'
import { generateDigestFromExisting } from '../../lib/pipeline'

// Netlify v1 background function — name must end in -background
// Responds 202 immediately, runs for up to 15 minutes
const handler: Handler = async () => {
  try {
    const result = await generateDigestFromExisting()
    console.log(`[digest-background] done — ${result.articleCount} articles, ok=${result.ok}`)
  } catch (err) {
    console.error('[digest-background] failed:', err)
  }
  return { statusCode: 200 }
}

export { handler }
