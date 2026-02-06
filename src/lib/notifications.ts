import { createAdminClient } from '@/lib/supabase/admin'

export async function createNotification(params: {
  userId: string
  title: string
  message: string
  type?: 'info' | 'success' | 'warning' | 'error'
  link?: string
}) {
  const adminClient = createAdminClient()
  const { error } = await adminClient.from('notifications').insert({
    user_id: params.userId,
    title: params.title,
    message: params.message,
    type: params.type || 'info',
    link: params.link || null,
  })
  if (error) console.error('[Notifications] Failed to create:', error.message)
  return !error
}
