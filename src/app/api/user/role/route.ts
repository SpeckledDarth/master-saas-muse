import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ role: null })
    }

    const admin = createAdminClient()

    const { data: roleData } = await admin
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .maybeSingle()

    return NextResponse.json({ role: roleData?.role || 'user' })
  } catch {
    return NextResponse.json({ role: 'user' })
  }
}
