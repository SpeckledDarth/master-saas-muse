import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from 'crypto'
import { getConfigValue, setDbSecret } from '@/lib/config/secrets'

const ALGORITHM = 'aes-256-gcm'
const IV_LENGTH = 16
const TAG_LENGTH = 16
const SALT = 'passivepost-token-salt'

let cachedKey: Buffer | null = null
let cachedSecret: string | null = null

async function getKey(): Promise<Buffer> {
  let secret = await getConfigValue('SOCIAL_ENCRYPTION_KEY')
  if (!secret) {
    const generated = randomBytes(32).toString('hex')
    await setDbSecret('SOCIAL_ENCRYPTION_KEY', generated, 'system-auto-generated')
    secret = await getConfigValue('SOCIAL_ENCRYPTION_KEY')
    if (!secret) {
      throw new Error('Failed to auto-generate SOCIAL_ENCRYPTION_KEY. Please set it manually.')
    }
    console.log('[Social Crypto] Auto-generated SOCIAL_ENCRYPTION_KEY and stored in database')
  }
  if (secret === cachedSecret && cachedKey) {
    return cachedKey
  }
  cachedSecret = secret
  cachedKey = scryptSync(secret, SALT, 32)
  return cachedKey
}

export async function encryptToken(plaintext: string): Promise<string> {
  const key = await getKey()
  const iv = randomBytes(IV_LENGTH)
  const cipher = createCipheriv(ALGORITHM, key, iv)

  let encrypted = cipher.update(plaintext, 'utf8', 'hex')
  encrypted += cipher.final('hex')

  const tag = cipher.getAuthTag()

  return `${iv.toString('hex')}:${tag.toString('hex')}:${encrypted}`
}

export async function decryptToken(ciphertext: string): Promise<string> {
  if (!ciphertext.includes(':')) {
    return ciphertext
  }

  const parts = ciphertext.split(':')
  if (parts.length !== 3) {
    return ciphertext
  }

  const key = await getKey()
  const iv = Buffer.from(parts[0], 'hex')
  const tag = Buffer.from(parts[1], 'hex')
  const encrypted = parts[2]

  const decipher = createDecipheriv(ALGORITHM, key, iv)
  decipher.setAuthTag(tag)

  let decrypted = decipher.update(encrypted, 'hex', 'utf8')
  decrypted += decipher.final('utf8')

  return decrypted
}

export function isEncrypted(value: string): boolean {
  if (!value.includes(':')) return false
  const parts = value.split(':')
  if (parts.length !== 3) return false
  return parts[0].length === IV_LENGTH * 2 && parts[1].length === TAG_LENGTH * 2
}
