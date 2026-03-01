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
      .from('user_email_addresses')
      .select('*')
      .eq('user_id', userId)
      .order('is_primary', { ascending: false })
      .order('created_at', { ascending: true })

    if (error) {
      if (safeTableError(error)) return NextResponse.json({ emails: [] })
      throw error
    }

    return NextResponse.json({ emails: data || [] })
  } catch (err) {
    console.error('Emails GET error:', err)
    return NextResponse.json({ error: 'Failed to load email addresses' }, { status: 500 })
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
    const { label, email, is_primary } = body

    if (!email || typeof email !== 'string') {
      return NextResponse.json({ error: 'email is required' }, { status: 400 })
    }

    if (is_primary) {
      await adminClient.from('user_email_addresses').update({ is_primary: false }).eq('user_id', userId)
    }

    const { data, error } = await adminClient
      .from('user_email_addresses')
      .insert({ user_id: userId, label: label || 'Personal', email, is_primary: !!is_primary, is_verified: false })
      .select()
      .single()

    if (error) throw error
    return NextResponse.json({ email: data })
  } catch (err) {
    console.error('Emails POST error:', err)
    return NextResponse.json({ error: 'Failed to add email address' }, { status: 500 })
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
    const { id, label, email, is_primary, is_verified } = body

    if (!id) {
      return NextResponse.json({ error: 'id is required' }, { status: 400 })
    }

    if (is_primary) {
      await adminClient.from('user_email_addresses').update({ is_primary: false }).eq('user_id', userId)
    }

    const updateData: Record<string, any> = {}
    if (label !== undefined) updateData.label = label
    if (email !== undefined) updateData.email = email
    if (is_primary !== undefined) updateData.is_primary = is_primary
    if (is_verified !== undefined) updateData.is_verified = is_verified

    const { data, error } = await adminClient
      .from('user_email_addresses')
      .update(updateData)
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single()

    if (error) throw error
    return NextResponse.json({ email: data })
  } catch (err) {
    console.error('Emails PUT error:', err)
    return NextResponse.json({ error: 'Failed to update email address' }, { status: 500 })
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
      .from('user_email_addresses')
      .delete()
      .eq('id', id)
      .eq('user_id', userId)

    if (error) throw error
    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('Emails DELETE error:', err)
    return NextResponse.json({ error: 'Failed to delete email address' }, { status: 500 })
  }
}
