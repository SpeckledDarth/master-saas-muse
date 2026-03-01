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
      .from('user_phone_numbers')
      .select('*')
      .eq('user_id', userId)
      .order('is_primary', { ascending: false })
      .order('created_at', { ascending: true })

    if (error) {
      if (safeTableError(error)) return NextResponse.json({ phones: [] })
      throw error
    }

    return NextResponse.json({ phones: data || [] })
  } catch (err) {
    console.error('Phones GET error:', err)
    return NextResponse.json({ error: 'Failed to load phone numbers' }, { status: 500 })
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
    const { label, phone_number, is_primary } = body

    if (!phone_number || typeof phone_number !== 'string') {
      return NextResponse.json({ error: 'phone_number is required' }, { status: 400 })
    }

    if (is_primary) {
      await adminClient.from('user_phone_numbers').update({ is_primary: false }).eq('user_id', userId)
    }

    const { data, error } = await adminClient
      .from('user_phone_numbers')
      .insert({ user_id: userId, label: label || 'Mobile', phone_number, is_primary: !!is_primary })
      .select()
      .single()

    if (error) throw error
    return NextResponse.json({ phone: data })
  } catch (err) {
    console.error('Phones POST error:', err)
    return NextResponse.json({ error: 'Failed to add phone number' }, { status: 500 })
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
    const { id, label, phone_number, is_primary } = body

    if (!id) {
      return NextResponse.json({ error: 'id is required' }, { status: 400 })
    }

    if (is_primary) {
      await adminClient.from('user_phone_numbers').update({ is_primary: false }).eq('user_id', userId)
    }

    const updateData: Record<string, any> = {}
    if (label !== undefined) updateData.label = label
    if (phone_number !== undefined) updateData.phone_number = phone_number
    if (is_primary !== undefined) updateData.is_primary = is_primary

    const { data, error } = await adminClient
      .from('user_phone_numbers')
      .update(updateData)
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single()

    if (error) throw error
    return NextResponse.json({ phone: data })
  } catch (err) {
    console.error('Phones PUT error:', err)
    return NextResponse.json({ error: 'Failed to update phone number' }, { status: 500 })
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
      .from('user_phone_numbers')
      .delete()
      .eq('id', id)
      .eq('user_id', userId)

    if (error) throw error
    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('Phones DELETE error:', err)
    return NextResponse.json({ error: 'Failed to delete phone number' }, { status: 500 })
  }
}
