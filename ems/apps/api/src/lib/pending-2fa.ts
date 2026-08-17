import { createHmac, randomBytes, timingSafeEqual } from 'node:crypto'
import { env } from '../config/env'

export const PENDING_2FA_COOKIE = 'stackedu_2fa_pending'

export interface Pending2faPayload {
  institutionId: string
  userId: string
  rememberMe: boolean
  exp: number
}

function signingKey(): string {
  return env().STORAGE_SIGNING_SECRET ?? 'stackedu-dev-2fa-signing-key-min-16'
}

export function createPending2faToken(
  payload: Omit<Pending2faPayload, 'exp'>,
  ttlMinutes = 5,
): string {
  const body = JSON.stringify({
    ...payload,
    exp: Date.now() + ttlMinutes * 60 * 1000,
    nonce: randomBytes(8).toString('hex'),
  })
  const signature = createHmac('sha256', signingKey()).update(body).digest('base64url')
  return `${Buffer.from(body).toString('base64url')}.${signature}`
}

export function parsePending2faToken(token: string): Pending2faPayload | null {
  const separator = token.lastIndexOf('.')
  if (separator <= 0) return null

  const encoded = token.slice(0, separator)
  const signature = token.slice(separator + 1)
  const body = Buffer.from(encoded, 'base64url').toString('utf8')
  const expected = createHmac('sha256', signingKey()).update(body).digest('base64url')

  const left = Buffer.from(signature)
  const right = Buffer.from(expected)
  if (left.length !== right.length || !timingSafeEqual(left, right)) return null

  try {
    const parsed = JSON.parse(body) as Pending2faPayload & { nonce?: string }
    if (!parsed.institutionId || !parsed.userId || !parsed.exp) return null
    if (parsed.exp <= Date.now()) return null
    return {
      institutionId: parsed.institutionId,
      userId: parsed.userId,
      rememberMe: Boolean(parsed.rememberMe),
      exp: parsed.exp,
    }
  } catch {
    return null
  }
}
