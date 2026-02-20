import { createClient } from '@supabase/supabase-js'

interface WatermarkConfig {
  enabled: boolean
  text: string
  position: string
}

let cachedWatermark: WatermarkConfig | null = null
let cacheExpiry = 0

export async function getWatermarkConfig(): Promise<WatermarkConfig> {
  const now = Date.now()
  if (cachedWatermark && now < cacheExpiry) {
    return cachedWatermark
  }

  try {
    const admin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
    const { data } = await admin
      .from('organization_settings')
      .select('settings')
      .eq('app_id', 'default')
      .single()

    const settings = (data?.settings || {}) as any
    cachedWatermark = {
      enabled: settings.watermark?.enabled ?? false,
      text: settings.watermark?.text || 'Posted via PassivePost',
      position: settings.watermark?.position || 'bottom',
    }
    cacheExpiry = now + 60000
    return cachedWatermark
  } catch {
    return { enabled: false, text: '', position: 'bottom' }
  }
}

export function applyWatermark(content: string, config: WatermarkConfig): string {
  if (!config.enabled || !config.text) return content
  return `${content}\n\n${config.text}`
}
