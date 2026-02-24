import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { generateApiKey, hashApiKey } from '@/lib/affiliate/api-auth'

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const admin = createAdminClient()

    const { data: keys, error } = await admin
      .from('affiliate_api_keys')
      .select('id, api_key_prefix, name, is_active, last_used_at, created_at')
      .eq('affiliate_user_id', user.id)
      .order('created_at', { ascending: false })

    if (error) {
      if (error.code === '42P01' || error.message?.includes('schema cache')) {
        return NextResponse.json({ keys: [] })
      }
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ keys: keys || [] })
  } catch (err: any) {
    if (err?.code === '42P01' || err?.message?.includes('does not exist')) {
      return NextResponse.json({ keys: [] })
    }
    console.error('API keys GET error:', err)
    return NextResponse.json({ error: 'Failed to load API keys' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json().catch(() => ({}))
    const name = body.name || 'Default'

    const admin = createAdminClient()

    const { count } = await admin
      .from('affiliate_api_keys')
      .select('id', { count: 'exact', head: true })
      .eq('affiliate_user_id', user.id)
      .eq('is_active', true)

    if ((count || 0) >= 5) {
      return NextResponse.json({ error: 'Maximum 5 active API keys allowed' }, { status: 400 })
    }

    const { fullKey, prefix, hash } = generateApiKey()

    const insertData: Record<string, any> = {
      affiliate_user_id: user.id,
      api_key_hash: hash,
      api_key_prefix: prefix,
      name,
    }

    const { data: newKey, error } = await admin
      .from('affiliate_api_keys')
      .insert(insertData)
      .select('id, api_key_prefix, name, is_active, created_at')
      .single()

    if (error) {
      if (error.code === '42703') {
        const { data: fallbackKey, error: fallbackError } = await admin
          .from('affiliate_api_keys')
          .insert({
            affiliate_user_id: user.id,
            api_key_hash: hash,
            api_key_prefix: prefix,
          })
          .select('id, api_key_prefix, name, is_active, created_at')
          .single()

        if (fallbackError) {
          return NextResponse.json({ error: fallbackError.message }, { status: 500 })
        }

        return NextResponse.json({
          key: { ...fallbackKey, fullKey },
          message: 'Save this API key now. It will not be shown again.',
        })
      }
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({
      key: { ...newKey, fullKey },
      message: 'Save this API key now. It will not be shown again.',
    })
  } catch (err: any) {
    console.error('API keys POST error:', err)
    return NextResponse.json({ error: 'Failed to generate API key' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { searchParams } = new URL(request.url)
    const keyId = searchParams.get('id')
    if (!keyId) return NextResponse.json({ error: 'Missing key ID' }, { status: 400 })

    const admin = createAdminClient()

    const { error } = await admin
      .from('affiliate_api_keys')
      .update({ is_active: false })
      .eq('id', keyId)
      .eq('affiliate_user_id', user.id)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err: any) {
    console.error('API keys DELETE error:', err)
    return NextResponse.json({ error: 'Failed to revoke API key' }, { status: 500 })
  }
}
