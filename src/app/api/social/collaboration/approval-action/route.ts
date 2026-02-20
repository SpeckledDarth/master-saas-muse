import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

function getSupabaseAdmin() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { token, postId, action, comment } = body as {
      token?: string
      postId?: string
      action?: 'approve' | 'reject' | 'request_changes'
      comment?: string
    }

    if (!token) return NextResponse.json({ error: 'Token is required' }, { status: 400 })
    if (!postId) return NextResponse.json({ error: 'postId is required' }, { status: 400 })
    if (!action || !['approve', 'reject', 'request_changes'].includes(action)) {
      return NextResponse.json({ error: 'Action must be approve, reject, or request_changes' }, { status: 400 })
    }

    const admin = getSupabaseAdmin()

    const { data: orgData } = await admin.from('organization_settings').select('settings').eq('app_id', 'default').single()
    const settings = (orgData?.settings || {}) as any
    const approvalTokens: any[] = settings.socialModule?.approvalTokens || []

    const tokenData = approvalTokens.find(t => t.token === token)
    if (!tokenData) return NextResponse.json({ error: 'Invalid or expired token' }, { status: 404 })

    if (new Date(tokenData.expiresAt) < new Date()) {
      return NextResponse.json({ error: 'Token has expired' }, { status: 410 })
    }

    if (!tokenData.postIds.includes(postId)) {
      return NextResponse.json({ error: 'Post not found in this approval batch' }, { status: 404 })
    }

    let newStatus: string
    const updateData: any = {}

    if (action === 'approve') {
      newStatus = 'scheduled'
      updateData.status = 'scheduled'
    } else if (action === 'reject') {
      newStatus = 'draft'
      updateData.status = 'draft'
    } else {
      newStatus = 'draft'
      updateData.status = 'draft'

      const { data: postData } = await admin.from('social_posts').select('metadata').eq('id', postId).single()
      const metadata = (postData?.metadata || {}) as any
      const changeRequests = metadata.changeRequests || []
      changeRequests.push({
        comment: comment || '',
        requestedAt: new Date().toISOString(),
      })
      updateData.metadata = { ...metadata, changeRequests }
    }

    const { error } = await admin.from('social_posts').update(updateData).eq('id', postId)
    if (error) {
      if (error.code === '42P01' || error.message?.includes('does not exist')) {
        return NextResponse.json({ error: 'Social posts table does not exist yet' }, { status: 500 })
      }
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, newStatus })
  } catch (err) {
    return NextResponse.json({ error: 'Failed to process approval action' }, { status: 500 })
  }
}
