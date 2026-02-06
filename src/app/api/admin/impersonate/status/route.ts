import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createAdminClient } from '@/lib/supabase/admin'

export async function GET() {
  const cookieStore = await cookies()
  const targetId = cookieStore.get('impersonation_target')?.value
  const adminId = cookieStore.get('impersonation_admin')?.value

  if (!targetId || !adminId) {
    return NextResponse.json({ active: false })
  }

  try {
    const adminClient = createAdminClient()
    const { data: targetUser } = await adminClient.auth.admin.getUserById(targetId)

    return NextResponse.json({
      active: true,
      targetUser: {
        id: targetId,
        email: targetUser?.user?.email || 'Unknown',
        name: targetUser?.user?.user_metadata?.full_name || targetUser?.user?.email || 'Unknown',
      },
    })
  } catch {
    return NextResponse.json({ active: false })
  }
}
