import { supabase } from '@/lib/supabase'
import SourcesClient from './SourcesClient'

export const dynamic = 'force-dynamic'

export default async function SourcesPage() {
  const { data: sources } = await supabase
    .from('sources')
    .select('*')
    .order('user_added')
    .order('name')

  return <SourcesClient initialSources={sources ?? []} />
}
