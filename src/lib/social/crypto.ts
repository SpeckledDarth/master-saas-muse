import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from 'crypto'

const ALGORITHM = 'aes-256-gcm'
const IV_LENGTH = 16
const TAG_LENGTH = 16
const SALT = 'passivepost-token-salt'

function getKey(): Buffer {
  const secret = process.env.SOCIAL_ENCRYPTION_KEY
  if (!secret) {
    throw new Error('SOCIAL_ENCRYPTION_KEY environment variable is not set. Generate one with: openssl rand -hex 32')
  }
  return scryptSync(secret, SALT, 32)
}

export function encryptToken(plaintext: string): string {
  const key = getKey()
  const iv = randomBytes(IV_LENGTH)
  const cipher = createCipheriv(ALGORITHM, key, iv)

  let encrypted = cipher.update(plaintext, 'utf8', 'hex')
  encrypted += cipher.final('hex')

  const tag = cipher.getAuthTag()

  return `${iv.toString('hex')}:${tag.toString('hex')}:${encrypted}`
}

export function decryptToken(ciphertext: string): string {
  if (!ciphertext.includes(':')) {
    return ciphertext
  }

  const parts = ciphertext.split(':')
  if (parts.length !== 3) {
    return ciphertext
  }

  const key = getKey()
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
