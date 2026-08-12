import { randomBytes, scrypt as scryptCallback, timingSafeEqual } from 'node:crypto'
import { promisify } from 'node:util'

/**
 * Password hashing.
 *
 * Uses scrypt from Node's standard library rather than a native module such as
 * argon2 or bcrypt. Those need compilation on every deploy target, and scrypt
 * is a memory-hard algorithm designed for exactly this, so the dependency buys
 * us nothing here.
 *
 * The cost parameters are stored inside the hash, so they can be raised later
 * without invalidating existing passwords.
 */

const scrypt = promisify(scryptCallback) as (
  password: string,
  salt: Buffer,
  keylen: number,
  options: { N: number; r: number; p: number; maxmem: number },
) => Promise<Buffer>

const KEY_LENGTH = 64
const SALT_LENGTH = 16
const COST = { N: 16_384, r: 8, p: 1 }
/** 128 * N * r is the working set; double it so scrypt never hits the ceiling. */
const MAXMEM = 128 * COST.N * COST.r * 2

function derive(password: string, salt: Buffer, cost: typeof COST): Promise<Buffer> {
  return scrypt(password.normalize('NFKC'), salt, KEY_LENGTH, { ...cost, maxmem: MAXMEM })
}

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(SALT_LENGTH)
  const key = await derive(password, salt, COST)

  return [
    'scrypt',
    COST.N,
    COST.r,
    COST.p,
    salt.toString('base64'),
    key.toString('base64'),
  ].join('$')
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const parts = stored.split('$')
  if (parts.length !== 6 || parts[0] !== 'scrypt') return false

  const [, n, r, p, saltB64, keyB64] = parts
  const cost = { N: Number(n), r: Number(r), p: Number(p) }
  if (!Number.isFinite(cost.N) || !Number.isFinite(cost.r) || !Number.isFinite(cost.p)) {
    return false
  }

  const expected = Buffer.from(keyB64!, 'base64')
  const actual = await derive(password, Buffer.from(saltB64!, 'base64'), cost)

  return expected.length === actual.length && timingSafeEqual(expected, actual)
}

/**
 * Burns roughly the same time as a real verification.
 *
 * Called when the email is unknown, so that a wrong address and a wrong
 * password take equally long and the response time cannot be used to discover
 * which addresses exist.
 */
export async function fakeVerify(): Promise<void> {
  await derive('placeholder', Buffer.alloc(SALT_LENGTH), COST)
}
