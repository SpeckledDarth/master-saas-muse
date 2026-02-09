import { createClient } from '@supabase/supabase-js'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'
import { productRegistry } from '@/lib/products/registry'

function getSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

async function getAuthenticatedUser(request: NextRequest) {
  const cookieStore = await cookies()

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
          }
        },
      },
    }
  )

  const { data: { user }, error } = await supabase.auth.getUser()

  if (error || !user) {
    return null
  }

  return user
}

async function isAdminUser(userId: string): Promise<boolean> {
  const { data } = await getSupabaseAdmin()
    .from('user_roles')
    .select('role')
    .eq('user_id', userId)
    .single()

  return data?.role === 'admin'
}

export async function GET(request: NextRequest) {
  const user = await getAuthenticatedUser(request)

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const isAdmin = await isAdminUser(user.id)
  if (!isAdmin) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  try {
    const products = await productRegistry.listProducts(false)
    return NextResponse.json({ products })
  } catch (error) {
    console.error('[Admin Products API] Error listing products:', error)
    return NextResponse.json({ error: 'Failed to list products' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  const user = await getAuthenticatedUser(request)

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const isAdmin = await isAdminUser(user.id)
  if (!isAdmin) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  try {
    const body = await request.json()
    const { slug, name, description, stripeProductId, metadataKey, tierDefinitions, featureLimits } = body

    if (!slug || !name || !metadataKey) {
      return NextResponse.json(
        { error: 'Missing required fields: slug, name, metadataKey' },
        { status: 400 }
      )
    }

    const product = await productRegistry.registerProduct({
      slug,
      name,
      description,
      stripeProductId,
      metadataKey,
      tierDefinitions: tierDefinitions || [],
      featureLimits,
    })

    return NextResponse.json({ product }, { status: 201 })
  } catch (error) {
    console.error('[Admin Products API] Error creating product:', error)
    return NextResponse.json({ error: 'Failed to create product' }, { status: 500 })
  }
}
