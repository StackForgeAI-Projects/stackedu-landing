import type { ApiError, ApiErrorCode } from '@stackedu/shared'

/**
 * The single place the web app talks to the API.
 *
 * The app is served from app.stackedu.rw and app.stackedu.africa while the API
 * answers on its own host, so every call is cross-origin. That has two
 * consequences handled here rather than at each call site: the base URL comes
 * from configuration, and credentials must be sent explicitly or the session
 * cookie is silently dropped.
 */

const API_URL: string = import.meta.env.VITE_API_URL ?? 'http://localhost:8080'

export class ApiClientError extends Error {
  readonly code: ApiErrorCode | 'NETWORK_ERROR'
  readonly status: number
  readonly details?: Record<string, string[]>
  /** Quote this to support and they can find the exact request in the logs. */
  readonly requestId?: string

  constructor(
    code: ApiErrorCode | 'NETWORK_ERROR',
    status: number,
    message: string,
    options?: { details?: Record<string, string[]>; requestId?: string },
  ) {
    super(message)
    this.name = 'ApiClientError'
    this.code = code
    this.status = status
    this.details = options?.details
    this.requestId = options?.requestId
  }

  /** True when retrying might succeed, so the UI can offer a "try again". */
  get isRetryable(): boolean {
    return this.code === 'NETWORK_ERROR' || this.status >= 500 || this.status === 429
  }
}

/**
 * What to show the user when a call fails.
 *
 * A validation failure's summary ("Some fields need your attention") tells them
 * nothing, so the first field message is preferred when there is one.
 */
export function apiErrorMessage(error: unknown, fallback: string): string {
  if (!(error instanceof ApiClientError)) return fallback
  return Object.values(error.details ?? {})[0]?.[0] ?? error.message
}

export interface RequestOptions {
  method?: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE'
  body?: unknown
  query?: Record<string, string | number | boolean | undefined>
  signal?: AbortSignal
  /** Makes a repeated write safe, used for payments and other one-off actions. */
  idempotencyKey?: string
}

function buildUrl(path: string, query?: RequestOptions['query']): string {
  const url = new URL(path.startsWith('/') ? path.slice(1) : path, `${API_URL}/`)

  for (const [key, value] of Object.entries(query ?? {})) {
    if (value !== undefined) url.searchParams.set(key, String(value))
  }

  return url.toString()
}

function isApiError(value: unknown): value is ApiError {
  return (
    typeof value === 'object' &&
    value !== null &&
    'error' in value &&
    typeof (value as ApiError).error?.code === 'string'
  )
}

export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = 'GET', body, query, signal, idempotencyKey } = options

  const headers: Record<string, string> = { Accept: 'application/json' }
  if (body !== undefined) headers['Content-Type'] = 'application/json'
  if (idempotencyKey) headers['idempotency-key'] = idempotencyKey

  let response: Response
  try {
    response = await fetch(buildUrl(path, query), {
      method,
      headers,
      // Without this the session cookie is not sent cross-origin, and every
      // request would look unauthenticated.
      credentials: 'include',
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
      ...(signal ? { signal } : {}),
    })
  } catch (cause) {
    if (cause instanceof DOMException && cause.name === 'AbortError') throw cause
    throw new ApiClientError(
      'NETWORK_ERROR',
      0,
      'We could not reach StackEDU. Please check your connection and try again.',
    )
  }

  if (response.status === 204) return undefined as T

  const payload: unknown = await response.json().catch(() => undefined)

  if (!response.ok) {
    if (isApiError(payload)) {
      throw new ApiClientError(
        payload.error.code as ApiErrorCode,
        response.status,
        payload.error.message,
        {
          ...(payload.error.details ? { details: payload.error.details } : {}),
          ...(payload.error.requestId ? { requestId: payload.error.requestId } : {}),
        },
      )
    }

    throw new ApiClientError('INTERNAL_ERROR', response.status, 'Something went wrong.', {
      ...(response.headers.get('x-request-id')
        ? { requestId: response.headers.get('x-request-id')! }
        : {}),
    })
  }

  return payload as T
}

export const api = {
  get: <T>(path: string, options?: Omit<RequestOptions, 'method' | 'body'>) =>
    apiRequest<T>(path, { ...options, method: 'GET' }),
  post: <T>(path: string, body?: unknown, options?: Omit<RequestOptions, 'method' | 'body'>) =>
    apiRequest<T>(path, { ...options, method: 'POST', body }),
  patch: <T>(path: string, body?: unknown, options?: Omit<RequestOptions, 'method' | 'body'>) =>
    apiRequest<T>(path, { ...options, method: 'PATCH', body }),
  delete: <T>(path: string, options?: Omit<RequestOptions, 'method' | 'body'>) =>
    apiRequest<T>(path, { ...options, method: 'DELETE' }),
}

export { API_URL }
