import { createClient } from '@/lib/supabase/server'
import { Metadata } from 'next'

async function getSettings() {
  const supabase = await createClient()
  const { data } = await supabase
    .from('organization_settings')
    .select('settings')
    .eq('app_id', 'default')
    .single()
  
  return data?.settings || {}
}

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSettings()
  const appName = settings?.branding?.appName || 'Blog'
  
  return {
    title: {
      template: `%s | ${appName} Blog`,
      default: `${appName} Blog`,
    },
    description: `Latest news, updates, and insights from ${appName}`,
  }
}

export default async function BlogLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-[calc(100vh-200px)]">
      {children}
    </div>
  )
}
