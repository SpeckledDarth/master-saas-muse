import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import {
  listSSOProviders,
  createSSOProvider,
  deleteSSOProvider,
  getSAMLMetadataUrl,
  getSAMLAcsUrl,
} from '@/lib/sso/provider'

function getSupabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

async function checkAdminAccess(): Promise<boolean> {
  try {
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() { return cookieStore.getAll() },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options)
              )
            } catch {}
          },
        },
      }
    )

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return false

    const admin = getSupabaseAdmin()
    const { data: member } = await admin
      .from('organization_members')
      .select('role')
      .eq('user_id', user.id)
      .in('role', ['owner', 'admin'])
      .single()

    return !!member
  } catch {
    return false
  }
}

export async function GET() {
  if (!(await checkAdminAccess())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const providers = await listSSOProviders()

    return NextResponse.json({
      providers,
      samlMetadataUrl: getSAMLMetadataUrl(),
      samlAcsUrl: getSAMLAcsUrl(),
    })
  } catch (err) {
    const message = (err as Error).message
    if (message.includes('422') || message.includes('SAML') || message.includes('not enabled')) {
      return NextResponse.json({
        providers: [],
        samlMetadataUrl: getSAMLMetadataUrl(),
        samlAcsUrl: getSAMLAcsUrl(),
        warning: 'SAML SSO requires Supabase Pro plan or above. Enable it in your Supabase Dashboard under Authentication > Providers > SAML 2.0.',
      })
    }
    console.error('[SSO] Failed to list providers:', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  if (!(await checkAdminAccess())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { action } = body

    switch (action) {
      case 'create': {
        const { metadataUrl, metadataXml, domains } = body

        if (!domains || !Array.isArray(domains) || domains.length === 0) {
          return NextResponse.json({ error: 'At least one domain is required' }, { status: 400 })
        }

        if (!metadataUrl && !metadataXml) {
          return NextResponse.json({ error: 'Either metadata URL or metadata XML is required' }, { status: 400 })
        }

        const provider = await createSSOProvider({
          metadataUrl,
          metadataXml,
          domains,
          attributeMapping: {
            keys: {
              email: { name: 'email' },
              name: { name: 'displayName' },
            },
          },
        })

        return NextResponse.json({ provider })
      }

      case 'delete': {
        const { providerId } = body

        if (!providerId) {
          return NextResponse.json({ error: 'Provider ID is required' }, { status: 400 })
        }

        await deleteSSOProvider(providerId)
        return NextResponse.json({ success: true })
      }

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }
  } catch (err) {
    console.error('[SSO] Error:', (err as Error).message)
    return NextResponse.json({ error: (err as Error).message }, { status: 500 })
  }
}
