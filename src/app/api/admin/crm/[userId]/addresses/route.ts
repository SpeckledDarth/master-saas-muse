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
      .from('user_addresses')
      .select('*')
      .eq('user_id', userId)
      .order('is_primary', { ascending: false })
      .order('created_at', { ascending: true })

    if (error) {
      if (safeTableError(error)) return NextResponse.json({ addresses: [] })
      throw error
    }

    return NextResponse.json({ addresses: data || [] })
  } catch (err) {
    console.error('Addresses GET error:', err)
    return NextResponse.json({ error: 'Failed to load addresses' }, { status: 500 })
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
    const { label, street, city, state, zip, country, is_primary } = body

    if (is_primary) {
      await adminClient.from('user_addresses').update({ is_primary: false }).eq('user_id', userId)
    }

    const { data, error } = await adminClient
      .from('user_addresses')
      .insert({
        user_id: userId,
        label: label || 'Home',
        street: street || '',
        city: city || '',
        state: state || '',
        zip: zip || '',
        country: country || 'US',
        is_primary: !!is_primary,
      })
      .select()
      .single()

    if (error) throw error
    return NextResponse.json({ address: data })
  } catch (err) {
    console.error('Addresses POST error:', err)
    return NextResponse.json({ error: 'Failed to add address' }, { status: 500 })
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
    const { id, label, street, city, state, zip, country, is_primary } = body

    if (!id) {
      return NextResponse.json({ error: 'id is required' }, { status: 400 })
    }

    if (is_primary) {
      await adminClient.from('user_addresses').update({ is_primary: false }).eq('user_id', userId)
    }

    const updateData: Record<string, any> = {}
    if (label !== undefined) updateData.label = label
    if (street !== undefined) updateData.street = street
    if (city !== undefined) updateData.city = city
    if (state !== undefined) updateData.state = state
    if (zip !== undefined) updateData.zip = zip
    if (country !== undefined) updateData.country = country
    if (is_primary !== undefined) updateData.is_primary = is_primary

    const { data, error } = await adminClient
      .from('user_addresses')
      .update(updateData)
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single()

    if (error) throw error
    return NextResponse.json({ address: data })
  } catch (err) {
    console.error('Addresses PUT error:', err)
    return NextResponse.json({ error: 'Failed to update address' }, { status: 500 })
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
      .from('user_addresses')
      .delete()
      .eq('id', id)
      .eq('user_id', userId)

    if (error) throw error
    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('Addresses DELETE error:', err)
    return NextResponse.json({ error: 'Failed to delete address' }, { status: 500 })
  }
}
