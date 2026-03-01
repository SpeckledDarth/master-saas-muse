import type { SupabaseClient } from '@supabase/supabase-js'

const RESERVED_WORDS = [
  'DISCOUNT', 'FREE', 'TEST', 'ADMIN', 'PASSIVEPOST', 'PROMO', 'COUPON',
  'SALE', 'DEAL', 'OFFER', 'TRIAL', 'DEMO', 'SAMPLE', 'NULL', 'UNDEFINED',
  'NONE', 'CODE', 'SAVE', 'CHEAP', 'BONUS',
]

export function isReservedCode(code: string): boolean {
  const upper = code.toUpperCase()
  return RESERVED_WORDS.some(w => upper === w || upper.startsWith(w) || upper.endsWith(w))
}

export function sanitizeCodeInput(raw: string): string {
  return raw.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 20)
}

function extractLastName(fullName: string): string {
  const parts = fullName.trim().split(/\s+/)
  const last = parts[parts.length - 1] || ''
  return last.toUpperCase().replace(/[^A-Z]/g, '')
}

function extractFirstName(fullName: string): string {
  const parts = fullName.trim().split(/\s+/)
  const first = parts[0] || ''
  return first.toUpperCase().replace(/[^A-Z]/g, '')
}

export async function generateBrandedCode(
  admin: SupabaseClient,
  affiliateName: string,
  affiliateUserId: string,
  discountPercent: number = 20,
): Promise<string | null> {
  const { data: existingCode } = await admin
    .from('affiliate_discount_codes')
    .select('id')
    .eq('affiliate_user_id', affiliateUserId)
    .eq('is_active', true)
    .maybeSingle()

  if (existingCode) return null

  const lastName = extractLastName(affiliateName)
  const firstName = extractFirstName(affiliateName)
  const namePart = lastName || firstName
  if (!namePart) return null

  const baseCode = `${namePart}${discountPercent}`

  const tryInsert = async (code: string): Promise<boolean> => {
    if (code.length < 4 || code.length > 20) return false
    if (isReservedCode(code)) return false

    const { data: taken } = await admin
      .from('affiliate_discount_codes')
      .select('id')
      .eq('code', code)
      .maybeSingle()

    if (taken) return false

    const { error } = await admin
      .from('affiliate_discount_codes')
      .insert({
        affiliate_user_id: affiliateUserId,
        code,
        discount_percent: discountPercent,
        is_active: true,
      })

    return !error
  }

  if (await tryInsert(baseCode)) return baseCode

  for (let i = 1; i <= 9; i++) {
    const suffixed = `${baseCode}${i}`
    if (suffixed.length <= 20 && await tryInsert(suffixed)) return suffixed
  }

  const altCodes = [
    firstName ? `${firstName}${discountPercent}` : '',
    firstName && lastName ? `${firstName}${lastName.slice(0, 1)}${discountPercent}` : '',
    firstName && lastName ? `${lastName}${firstName.slice(0, 1)}${discountPercent}` : '',
  ].filter(Boolean)
  for (const alt of altCodes) {
    if (alt.length >= 4 && alt.length <= 20 && await tryInsert(alt)) return alt
  }

  return null
}

export function generateAlternativeSuggestions(
  name: string,
  discountPercent: number,
): string[] {
  const lastName = extractLastName(name)
  const firstName = extractFirstName(name)
  const suggestions: string[] = []

  if (firstName && lastName) {
    suggestions.push(`${firstName[0]}${lastName}${discountPercent}`)
    suggestions.push(`${lastName}${discountPercent}OFF`)
    suggestions.push(`${firstName}${lastName[0]}${discountPercent}`)
    suggestions.push(`${firstName}${discountPercent}`)
  }

  return suggestions
    .map(s => s.toUpperCase().replace(/[^A-Z0-9]/g, ''))
    .filter(s => s.length >= 4 && s.length <= 20 && !isReservedCode(s))
    .slice(0, 4)
}
