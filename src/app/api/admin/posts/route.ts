import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type')
    const published = searchParams.get('published')
    const adminOnly = searchParams.get('admin') === 'true'
    
    // For admin requests, verify user is actually an admin before using admin client
    let client = supabase
    if (adminOnly) {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }
      
      const { data: userRole } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .single()
      
      if (userRole?.role !== 'admin') {
        return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
      }
      
      client = createAdminClient()
    }
    
    let query = client.from('posts').select('*').order('created_at', { ascending: false })
    
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
    
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    console.log('Posts API - User:', user?.id, 'Auth error:', authError?.message)
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized - Please log in' }, { status: 401 })
    }

    // Use admin client to check roles (bypasses RLS)
    const adminClient = createAdminClient()
    const { data: userRole, error: roleError } = await adminClient
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .single()

    console.log('Posts API - Role:', userRole?.role, 'Role error:', roleError?.message)

    if (userRole?.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    const body = await request.json()
    const { id, title, slug, excerpt, content, type, published } = body

    // Use raw SQL to bypass schema cache issues
    const finalSlug = slug || title.toLowerCase().replace(/[^a-z0-9]+/g, '-')
    const now = new Date().toISOString()
    
    if (id) {
      // Update existing post
      const { error } = await adminClient.rpc('exec_sql', {
        query: `UPDATE posts SET title = $1, slug = $2, excerpt = $3, content = $4, type = $5, published = $6, published_at = $7, updated_at = $8 WHERE id = $9`,
        params: [title, finalSlug, excerpt || '', content, type || 'blog', published || false, published ? now : null, now, id]
      })
      
      // If RPC doesn't exist, fall back to direct query via fetch
      if (error?.message?.includes('function') || error?.message?.includes('does not exist')) {
        // Use direct SQL via Supabase REST API
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
        const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
        
        const response = await fetch(`${supabaseUrl}/rest/v1/posts?id=eq.${id}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'apikey': serviceKey!,
            'Authorization': `Bearer ${serviceKey}`,
            'Prefer': 'return=minimal'
          },
          body: JSON.stringify({
            title,
            slug: finalSlug,
            excerpt: excerpt || '',
            content,
            type: type || 'blog',
            published: published || false,
            published_at: published ? now : null,
            updated_at: now
          })
        })
        
        if (!response.ok) {
          const errText = await response.text()
          console.error('Update error:', errText)
          return NextResponse.json({ error: errText }, { status: 500 })
        }
      } else if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
      }
    } else {
      // Insert new post - use direct REST API
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
      const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
      
      const response = await fetch(`${supabaseUrl}/rest/v1/posts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': serviceKey!,
          'Authorization': `Bearer ${serviceKey}`,
          'Prefer': 'return=minimal'
        },
        body: JSON.stringify({
          title,
          slug: finalSlug,
          excerpt: excerpt || '',
          content,
          type: type || 'blog',
          published: published || false,
          published_at: published ? now : null,
          author_id: user.id
        })
      })
      
      if (!response.ok) {
        const errText = await response.text()
        console.error('Insert error:', errText)
        return NextResponse.json({ error: errText }, { status: 500 })
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
    
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check admin role before deleting
    const { data: userRole } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .single()

    if (userRole?.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const postId = searchParams.get('id')

    if (!postId) {
      return NextResponse.json({ error: 'Post ID required' }, { status: 400 })
    }

    const adminClient = createAdminClient()
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
