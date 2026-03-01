import { NextRequest, NextResponse } from 'next/server'
import { verifyAdminAccess, isErrorResponse, safeTableError } from '@/lib/admin-auth'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const auth = await verifyAdminAccess()
    if (isErrorResponse(auth)) return auth.error
    const { adminClient } = auth
    const { userId } = await params

    const { data, error } = await adminClient
      .from('user_social_links')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: true })

    if (error) {
      if (safeTableError(error)) return NextResponse.json({ socialLinks: [] })
      throw error
    }

    return NextResponse.json({ socialLinks: data || [] })
  } catch (err) {
    console.error('Social links GET error:', err)
    return NextResponse.json({ error: 'Failed to load social links' }, { status: 500 })
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const auth = await verifyAdminAccess()
    if (isErrorResponse(auth)) return auth.error
    const { adminClient } = auth
    const { userId } = await params

    const body = await request.json()
    const { platform, url } = body

    if (!platform || typeof platform !== 'string') {
      return NextResponse.json({ error: 'platform is required' }, { status: 400 })
    }
    if (!url || typeof url !== 'string') {
      return NextResponse.json({ error: 'url is required' }, { status: 400 })
    }

    const { data, error } = await adminClient
      .from('user_social_links')
      .insert({ user_id: userId, platform, url })
      .select()
      .single()

    if (error) throw error
    return NextResponse.json({ socialLink: data })
  } catch (err) {
    console.error('Social links POST error:', err)
    return NextResponse.json({ error: 'Failed to add social link' }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const auth = await verifyAdminAccess()
    if (isErrorResponse(auth)) return auth.error
    const { adminClient } = auth
    const { userId } = await params

    const body = await request.json()
    const { id, platform, url } = body

    if (!id) {
      return NextResponse.json({ error: 'id is required' }, { status: 400 })
    }

    const updateData: Record<string, any> = {}
    if (platform !== undefined) updateData.platform = platform
    if (url !== undefined) updateData.url = url

    const { data, error } = await adminClient
      .from('user_social_links')
      .update(updateData)
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single()

    if (error) throw error
    return NextResponse.json({ socialLink: data })
  } catch (err) {
    console.error('Social links PUT error:', err)
    return NextResponse.json({ error: 'Failed to update social link' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const auth = await verifyAdminAccess()
    if (isErrorResponse(auth)) return auth.error
    const { adminClient } = auth
    const { userId } = await params

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'id is required' }, { status: 400 })
    }

    const { error } = await adminClient
      .from('user_social_links')
      .delete()
      .eq('id', id)
      .eq('user_id', userId)

    if (error) throw error
    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('Social links DELETE error:', err)
    return NextResponse.json({ error: 'Failed to delete social link' }, { status: 500 })
  }
}
