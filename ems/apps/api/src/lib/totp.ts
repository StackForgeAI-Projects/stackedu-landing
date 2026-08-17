import QRCode from 'qrcode'
import { generateSecret, generateURI, verifySync } from 'otplib'

export function createTotpSecret(): string {
  return generateSecret()
}

export function totpUri(input: { email: string; issuer: string; secret: string }): string {
  return generateURI({
    issuer: input.issuer,
    label: input.email,
    secret: input.secret,
  })
}

export async function totpQrDataUrl(otpauthUrl: string): Promise<string> {
  return QRCode.toDataURL(otpauthUrl, { margin: 1, width: 220 })
}

export function verifyTotpCode(secret: string, code: string): boolean {
  const result = verifySync({ secret, token: code.trim() })
  return result.valid === true
}
