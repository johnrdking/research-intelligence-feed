import { runDailyIngest, generateDigestFromExisting } from '../lib/pipeline'

const mode     = process.argv[2] ?? 'ingest'   // 'ingest' | 'digest'
const fromDate = process.argv[3] ?? process.env.FROM_DATE

async function main() {
  if (mode === 'digest') {
    console.log('Generating digest from existing articles...')
    const result = await generateDigestFromExisting()
    console.log(`Done: ok=${result.ok}, articles=${result.articleCount}`)
    return
  }

  console.log(`Starting ingest from ${fromDate ?? 'yesterday'}...`)
  const result = await runDailyIngest(fromDate)
  console.log(`Done: ${result.ingested} ingested, ${result.skipped} skipped`)
}

main().catch(err => {
  console.error('Failed:', err)
  process.exit(1)
})
