import { NextRequest, NextResponse } from 'next/server'
import { verifyAdminAccess, isErrorResponse, safeTableError } from '@/lib/admin-auth'

export async function GET(request: NextRequest) {
  try {
    const auth = await verifyAdminAccess()
    if (isErrorResponse(auth)) return auth.error
    const { adminClient } = auth

    const url = new URL(request.url)
    const entityType = url.searchParams.get('entity_type')
    const entityId = url.searchParams.get('entity_id')

    if (!entityType || !entityId) {
      return NextResponse.json({ error: 'entity_type and entity_id are required' }, { status: 400 })
    }

    const { data, error } = await adminClient
      .from('entity_notes')
      .select('*')
      .eq('entity_type', entityType)
      .eq('entity_id', entityId)
      .order('created_at', { ascending: false })

    if (error) {
      if (safeTableError(error)) return NextResponse.json({ notes: [] })
      throw error
    }

    const authorIds = [...new Set((data || []).map(n => n.author_id))]
    let authorMap: Record<string, string> = {}

    if (authorIds.length > 0) {
      try {
        const { data: authData } = await adminClient.auth.admin.listUsers({ page: 1, perPage: 1000 })
        if (authData?.users) {
          for (const u of authData.users) {
            if (authorIds.includes(u.id)) {
              authorMap[u.id] = u.user_metadata?.display_name || u.user_metadata?.full_name || u.email || 'Unknown'
            }
          }
        }
      } catch {}
    }

    const notes = (data || []).map(n => ({
      ...n,
      author_name: authorMap[n.author_id] || 'Unknown',
    }))

    return NextResponse.json({ notes })
  } catch (err) {
    console.error('Entity notes GET error:', err)
    return NextResponse.json({ error: 'Failed to load notes' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await verifyAdminAccess()
    if (isErrorResponse(auth)) return auth.error
    const { user, adminClient } = auth

    const body = await request.json()
    const { entity_type, entity_id, body: noteBody } = body

    if (!entity_type || !entity_id || !noteBody) {
      return NextResponse.json({ error: 'entity_type, entity_id, and body are required' }, { status: 400 })
    }

    const { data, error } = await adminClient
      .from('entity_notes')
      .insert({
        entity_type,
        entity_id,
        author_id: user.id,
        body: noteBody,
      })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ note: data })
  } catch (err) {
    console.error('Entity notes POST error:', err)
    return NextResponse.json({ error: 'Failed to create note' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const auth = await verifyAdminAccess()
    if (isErrorResponse(auth)) return auth.error
    const { user, adminClient, isAdmin } = auth

    const url = new URL(request.url)
    const noteId = url.searchParams.get('id')

    if (!noteId) {
      return NextResponse.json({ error: 'id query parameter is required' }, { status: 400 })
    }

    if (!isAdmin) {
      const { data: note } = await adminClient
        .from('entity_notes')
        .select('author_id')
        .eq('id', noteId)
        .maybeSingle()

      if (note && note.author_id !== user.id) {
        return NextResponse.json({ error: 'Only the author or an admin can delete this note' }, { status: 403 })
      }
    }

    const { error } = await adminClient
      .from('entity_notes')
      .delete()
      .eq('id', noteId)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('Entity notes DELETE error:', err)
    return NextResponse.json({ error: 'Failed to delete note' }, { status: 500 })
  }
}
