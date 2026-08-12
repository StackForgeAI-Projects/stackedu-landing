import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import type { Hono } from 'hono'
import { createApp } from '../src/app'
import { closeAllConnections } from '../src/db/connection'
import { createTestPlatform, type TestPlatform } from './helpers/test-database'

/**
 * The HTTP surface: health, error shape, and the cross-origin rules that make
 * app.stackedu.rw and app.stackedu.africa able to talk to api.stackedu.rw.
 */
describe('http app', () => {
  let platform: TestPlatform
  let app: Hono<never>

  beforeAll(async () => {
    platform = await createTestPlatform()
    process.env.ALLOWED_ORIGINS = 'https://app.stackedu.rw,https://app.stackedu.africa'
    app = createApp().app as unknown as Hono<never>
  })

  afterAll(async () => {
    await closeAllConnections()
    await platform.cleanup()
  })

  describe('health', () => {
    it('answers liveness without touching the database', async () => {
      const response = await app.request('/health')
      expect(response.status).toBe(200)
      await expect(response.json()).resolves.toEqual({
        status: 'ok',
        service: 'stackedu-api',
      })
    })

    it('reports readiness including the platform database', async () => {
      const response = await app.request('/health/ready')
      expect(response.status).toBe(200)

      const body = (await response.json()) as {
        status: string
        checks: Record<string, { ok: boolean }>
      }
      expect(body.status).toBe('ok')
      expect(body.checks.platformDatabase?.ok).toBe(true)
    })
  })

  describe('cross-origin rules', () => {
    it('allows the Rwandan app domain', async () => {
      const response = await app.request('/health', {
        headers: { Origin: 'https://app.stackedu.rw' },
      })
      expect(response.headers.get('access-control-allow-origin')).toBe('https://app.stackedu.rw')
      expect(response.headers.get('access-control-allow-credentials')).toBe('true')
    })

    it('allows the pan-African app domain', async () => {
      const response = await app.request('/health', {
        headers: { Origin: 'https://app.stackedu.africa' },
      })
      expect(response.headers.get('access-control-allow-origin')).toBe(
        'https://app.stackedu.africa',
      )
    })

    it('does not allow an unknown site to call the API', async () => {
      const response = await app.request('/health', {
        headers: { Origin: 'https://attacker.example' },
      })
      expect(response.headers.get('access-control-allow-origin')).toBeNull()
    })

    it('never answers with a wildcard, because requests carry cookies', async () => {
      const response = await app.request('/health', {
        headers: { Origin: 'https://app.stackedu.rw' },
      })
      expect(response.headers.get('access-control-allow-origin')).not.toBe('*')
    })

    it('handles the preflight request browsers send before a write', async () => {
      const response = await app.request('/health', {
        method: 'OPTIONS',
        headers: {
          Origin: 'https://app.stackedu.rw',
          'Access-Control-Request-Method': 'POST',
          'Access-Control-Request-Headers': 'content-type,idempotency-key',
        },
      })

      expect(response.status).toBeLessThan(300)
      expect(response.headers.get('access-control-allow-methods')).toContain('POST')
      expect(response.headers.get('access-control-allow-headers')?.toLowerCase()).toContain(
        'idempotency-key',
      )
    })
  })

  describe('errors', () => {
    it('returns the shared error shape for an unknown route', async () => {
      const response = await app.request('/no-such-route')
      expect(response.status).toBe(404)

      const body = (await response.json()) as { error: { code: string; message: string } }
      expect(body.error.code).toBe('NOT_FOUND')
      expect(body.error.message).toContain('/no-such-route')
    })

    it('attaches a request id so a user report can be traced to a log line', async () => {
      const response = await app.request('/no-such-route')
      const body = (await response.json()) as { error: { requestId?: string } }

      expect(response.headers.get('x-request-id')).toBeTruthy()
      expect(body.error.requestId).toBe(response.headers.get('x-request-id'))
    })

    it('keeps a caller-supplied request id so a trace spans both services', async () => {
      const response = await app.request('/health', {
        headers: { 'x-request-id': 'trace-me-12345' },
      })
      expect(response.headers.get('x-request-id')).toBe('trace-me-12345')
    })
  })

  describe('security headers', () => {
    it('sets the standard protective headers on every response', async () => {
      const response = await app.request('/health')
      expect(response.headers.get('x-content-type-options')).toBe('nosniff')
      expect(response.headers.get('x-frame-options')).toBe('SAMEORIGIN')
    })
  })
})
