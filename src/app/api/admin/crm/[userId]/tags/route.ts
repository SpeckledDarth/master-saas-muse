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
      .from('user_tags')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: true })

    if (error) {
      if (safeTableError(error)) return NextResponse.json({ tags: [] })
      throw error
    }

    return NextResponse.json({ tags: data || [] })
  } catch (err) {
    console.error('Tags GET error:', err)
    return NextResponse.json({ error: 'Failed to load tags' }, { status: 500 })
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const auth = await verifyAdminAccess()
    if (isErrorResponse(auth)) return auth.error
    const { user, adminClient } = auth
    const { userId } = await params

    const body = await request.json()
    const { tag, color } = body

    if (!tag || typeof tag !== 'string') {
      return NextResponse.json({ error: 'tag is required' }, { status: 400 })
    }

    const { data, error } = await adminClient
      .from('user_tags')
      .insert({
        user_id: userId,
        tag: tag.trim(),
        color: color || 'gray',
        created_by: user.id,
      })
      .select()
      .single()

    if (error) {
      if (error.code === '23505') {
        return NextResponse.json({ error: 'Tag already exists on this user' }, { status: 409 })
      }
      throw error
    }

    return NextResponse.json({ tag: data })
  } catch (err) {
    console.error('Tags POST error:', err)
    return NextResponse.json({ error: 'Failed to add tag' }, { status: 500 })
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

    const url = new URL(request.url)
    const tag = url.searchParams.get('tag')

    if (!tag) {
      return NextResponse.json({ error: 'tag query parameter is required' }, { status: 400 })
    }

    const { error } = await adminClient
      .from('user_tags')
      .delete()
      .eq('user_id', userId)
      .eq('tag', tag)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('Tags DELETE error:', err)
    return NextResponse.json({ error: 'Failed to remove tag' }, { status: 500 })
  }
}
