import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getTeamPermissions, type TeamRole } from '@/lib/team-permissions'

async function checkUserPermissions(userId: string, adminClient: any) {
  const { data: userRole } = await adminClient
    .from('user_roles')
    .select('role')
    .eq('user_id', userId)
    .maybeSingle()

  if (userRole?.role === 'admin') {
    return { isAppAdmin: true, permissions: getTeamPermissions('owner') }
  }

  const { data: teamMember } = await adminClient
    .from('organization_members')
    .select('role')
    .eq('user_id', userId)
    .eq('organization_id', 1)
    .maybeSingle()

  if (teamMember?.role) {
    return { 
      isAppAdmin: false, 
      permissions: getTeamPermissions(teamMember.role as TeamRole)
    }
  }

  return { isAppAdmin: false, permissions: null }
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const adminClient = createAdminClient()
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type')
    const published = searchParams.get('published')
    const adminOnly = searchParams.get('admin') === 'true'
    
    if (adminOnly) {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }
      
      const { permissions } = await checkUserPermissions(user.id, adminClient)
      
      if (!permissions?.canEditContent) {
        return NextResponse.json({ error: 'Access denied' }, { status: 403 })
      }
    }
    
    let query = adminClient.from('posts').select('*').order('created_at', { ascending: false })
    
    if (type) {
      query = query.eq('type', type)
    }
    if (published === 'true') {
      query = query.eq('published', true)
    }

    const { data: posts, error } = await query

    if (error) {
      console.error('Error fetching posts:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ posts: posts || [] })
  } catch (error) {
    console.error('Posts fetch error:', error)
    return NextResponse.json({ error: 'Failed to fetch posts' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const adminClient = createAdminClient()
    
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized - Please log in' }, { status: 401 })
    }

    const { permissions } = await checkUserPermissions(user.id, adminClient)
    
    if (!permissions?.canEditContent) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    const body = await request.json()
    const { id, title, slug, excerpt, content, type, published } = body

    if (published && !permissions?.canPublishContent) {
      return NextResponse.json({ error: 'You do not have permission to publish content' }, { status: 403 })
    }

    const finalSlug = slug || title.toLowerCase().replace(/[^a-z0-9]+/g, '-')
    const now = new Date().toISOString()

    if (id) {
      const { error } = await adminClient
        .from('posts')
        .update({
          title,
          slug: finalSlug,
          excerpt: excerpt || '',
          content,
          type: type || 'blog',
          published: published || false,
          published_at: published ? now : null,
          updated_at: now
        })
        .eq('id', id)

      if (error) {
        console.error('Update error:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
      }
    } else {
      const { error } = await adminClient
        .from('posts')
        .insert({
          title,
          slug: finalSlug,
          excerpt: excerpt || '',
          content,
          type: type || 'blog',
          published: published || false,
          published_at: published ? now : null,
          author_id: user.id
        })

      if (error) {
        console.error('Insert error:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
      }
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Post save error:', error)
    return NextResponse.json({ error: 'Failed to save post' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient()
    const adminClient = createAdminClient()
    
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { permissions } = await checkUserPermissions(user.id, adminClient)
    
    if (!permissions?.canManageUsers) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const postId = searchParams.get('id')

    if (!postId) {
      return NextResponse.json({ error: 'Post ID required' }, { status: 400 })
    }

    const { error } = await adminClient
      .from('posts')
      .delete()
      .eq('id', postId)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete post error:', error)
    return NextResponse.json({ error: 'Failed to delete post' }, { status: 500 })
  }
}
