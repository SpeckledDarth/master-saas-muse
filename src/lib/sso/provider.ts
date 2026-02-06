export interface SSOProvider {
  id: string
  type: 'saml'
  saml?: {
    entity_id: string
    metadata_url?: string
    metadata_xml?: string
  }
  domains: { id: string; domain: string; created_at: string }[]
  created_at: string
  updated_at: string
}

export interface SSOProviderListResponse {
  items: SSOProvider[]
}

export interface CreateSSOProviderParams {
  metadataUrl?: string
  metadataXml?: string
  domains: string[]
  attributeMapping?: {
    keys: Record<string, { name: string }>
  }
}

function getAuthHeaders(): Record<string, string> {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
  return {
    'apikey': serviceRoleKey,
    'Authorization': `Bearer ${serviceRoleKey}`,
    'Content-Type': 'application/json',
  }
}

function getAuthBaseUrl(): string {
  return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/auth/v1`
}

export async function listSSOProviders(): Promise<SSOProvider[]> {
  const response = await fetch(
    `${getAuthBaseUrl()}/admin/sso/providers`,
    { headers: getAuthHeaders() }
  )

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Failed to list SSO providers: ${response.status} ${error}`)
  }

  const data: SSOProviderListResponse = await response.json()
  return data.items || []
}

export async function getSSOProvider(providerId: string): Promise<SSOProvider> {
  const response = await fetch(
    `${getAuthBaseUrl()}/admin/sso/providers/${providerId}`,
    { headers: getAuthHeaders() }
  )

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Failed to get SSO provider: ${response.status} ${error}`)
  }

  return response.json()
}

export async function createSSOProvider(params: CreateSSOProviderParams): Promise<SSOProvider> {
  const body: Record<string, unknown> = {
    type: 'saml',
    domains: params.domains,
  }

  if (params.metadataUrl) {
    body.metadata_url = params.metadataUrl
  } else if (params.metadataXml) {
    body.metadata_xml = params.metadataXml
  }

  if (params.attributeMapping) {
    body.attribute_mapping = params.attributeMapping
  }

  const response = await fetch(
    `${getAuthBaseUrl()}/admin/sso/providers`,
    {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(body),
    }
  )

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Failed to create SSO provider: ${response.status} ${error}`)
  }

  return response.json()
}

export async function updateSSOProvider(
  providerId: string,
  params: Partial<CreateSSOProviderParams>
): Promise<SSOProvider> {
  const body: Record<string, unknown> = {}

  if (params.metadataUrl) {
    body.metadata_url = params.metadataUrl
  } else if (params.metadataXml) {
    body.metadata_xml = params.metadataXml
  }

  if (params.domains) {
    body.domains = params.domains
  }

  if (params.attributeMapping) {
    body.attribute_mapping = params.attributeMapping
  }

  const response = await fetch(
    `${getAuthBaseUrl()}/admin/sso/providers/${providerId}`,
    {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(body),
    }
  )

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Failed to update SSO provider: ${response.status} ${error}`)
  }

  return response.json()
}

export async function deleteSSOProvider(providerId: string): Promise<void> {
  const response = await fetch(
    `${getAuthBaseUrl()}/admin/sso/providers/${providerId}`,
    {
      method: 'DELETE',
      headers: getAuthHeaders(),
    }
  )

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Failed to delete SSO provider: ${response.status} ${error}`)
  }
}

export function getSAMLMetadataUrl(): string {
  return `${getAuthBaseUrl()}/sso/saml/metadata`
}

export function getSAMLAcsUrl(): string {
  return `${getAuthBaseUrl()}/sso/saml/acs`
}

export async function checkDomainSSO(domain: string): Promise<{ hasSSO: boolean; providerId?: string }> {
  try {
    const providers = await listSSOProviders()
    const match = providers.find(p =>
      p.domains.some(d => d.domain === domain)
    )
    return match
      ? { hasSSO: true, providerId: match.id }
      : { hasSSO: false }
  } catch {
    return { hasSSO: false }
  }
}
