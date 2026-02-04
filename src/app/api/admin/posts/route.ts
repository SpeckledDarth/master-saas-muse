import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { query } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type')
    const published = searchParams.get('published')
    const adminOnly = searchParams.get('admin') === 'true'
    
    // For admin requests, verify user is actually an admin
    if (adminOnly) {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }
      
      const { data: roles } = await query('SELECT role FROM user_roles WHERE user_id = $1', [user.id])
      
      if (!roles || roles.length === 0 || roles[0].role !== 'admin') {
        return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
      }
    }
    
    // Build query with filters
    let sql = 'SELECT * FROM posts'
    const params: any[] = []
    const conditions: string[] = []
    
    if (type) {
      params.push(type)
      conditions.push(`type = $${params.length}`)
    }
    if (published === 'true') {
      conditions.push('published = true')
    }
    
    if (conditions.length > 0) {
      sql += ' WHERE ' + conditions.join(' AND ')
    }
    sql += ' ORDER BY created_at DESC'

    const { data: posts, error } = await query(sql, params)

    if (error) {
      console.error('Error fetching posts:', error)
      return NextResponse.json({ error }, { status: 500 })
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

    // Check admin role using direct pg
    const { data: roles, error: roleError } = await query('SELECT role FROM user_roles WHERE user_id = $1', [user.id])
    console.log('Posts API - Roles:', roles, 'Role error:', roleError)

    if (!roles || roles.length === 0 || roles[0].role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    const body = await request.json()
    const { id, title, slug, excerpt, content, type, published } = body

    const finalSlug = slug || title.toLowerCase().replace(/[^a-z0-9]+/g, '-')
    const now = new Date().toISOString()

    if (id) {
      // Update existing post using direct pg
      const { error } = await query(
        `UPDATE posts SET title = $1, slug = $2, excerpt = $3, content = $4, type = $5, published = $6, published_at = $7, updated_at = $8 WHERE id = $9`,
        [title, finalSlug, excerpt || '', content, type || 'blog', published || false, published ? now : null, now, id]
      )

      if (error) {
        console.error('Update error:', error)
        return NextResponse.json({ error }, { status: 500 })
      }
    } else {
      // Insert new post using direct pg
      const { error } = await query(
        `INSERT INTO posts (title, slug, excerpt, content, type, published, published_at, author_id) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [title, finalSlug, excerpt || '', content, type || 'blog', published || false, published ? now : null, user.id]
      )

      if (error) {
        console.error('Insert error:', error)
        return NextResponse.json({ error }, { status: 500 })
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

    // Check admin role using direct pg
    const { data: roles } = await query('SELECT role FROM user_roles WHERE user_id = $1', [user.id])

    if (!roles || roles.length === 0 || roles[0].role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const postId = searchParams.get('id')

    if (!postId) {
      return NextResponse.json({ error: 'Post ID required' }, { status: 400 })
    }

    const { error } = await query('DELETE FROM posts WHERE id = $1', [postId])

    if (error) {
      return NextResponse.json({ error }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete post error:', error)
    return NextResponse.json({ error: 'Failed to delete post' }, { status: 500 })
  }
}
