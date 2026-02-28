import { cookies } from 'next/headers'
import { createClient } from '@/lib/supabase/server'

export async function getEffectiveUserId(): Promise<{ userId: string; isImpersonating: boolean } | null> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const cookieStore = await cookies()
  const targetId = cookieStore.get('impersonation_target')?.value
  const adminId = cookieStore.get('impersonation_admin')?.value

  if (targetId && adminId && adminId === user.id) {
    return { userId: targetId, isImpersonating: true }
  }

  return { userId: user.id, isImpersonating: false }
}
