import { z } from 'zod'

/**
 * Every error the API returns uses this one shape, so the web and mobile
 * clients only ever need to understand a single failure format.
 */
export const apiErrorSchema = z.object({
  error: z.object({
    /** Stable machine-readable code such as NOT_FOUND. Safe to branch on. */
    code: z.string(),
    /** Human-readable sentence, safe to show to a user. */
    message: z.string(),
    /** Field-level validation problems, keyed by field path. */
    details: z.record(z.array(z.string())).optional(),
    /** Correlates a user-visible failure with the server logs. */
    requestId: z.string().optional(),
  }),
})

export const apiErrorCodes = [
  'BAD_REQUEST',
  'VALIDATION_FAILED',
  'UNAUTHENTICATED',
  'FORBIDDEN',
  'NOT_FOUND',
  'CONFLICT',
  'RATE_LIMITED',
  'PAYLOAD_TOO_LARGE',
  'INTERNAL_ERROR',
  'SERVICE_UNAVAILABLE',
] as const

export const apiErrorCodeSchema = z.enum(apiErrorCodes)

export const healthSchema = z.object({
  status: z.enum(['ok', 'degraded']),
  service: z.literal('stackedu-api'),
  version: z.string(),
  uptimeSeconds: z.number(),
  checks: z.record(z.object({ ok: z.boolean(), latencyMs: z.number().optional() })),
})

export function paginatedSchema<T extends z.ZodTypeAny>(item: T) {
  return z.object({
    items: z.array(item),
    page: z.number().int().min(1),
    pageSize: z.number().int().min(1),
    total: z.number().int().nonnegative(),
    totalPages: z.number().int().nonnegative(),
  })
}

export type ApiError = z.infer<typeof apiErrorSchema>
export type ApiErrorCode = z.infer<typeof apiErrorCodeSchema>
export type Health = z.infer<typeof healthSchema>
export type Paginated<T> = {
  items: T[]
  page: number
  pageSize: number
  total: number
  totalPages: number
}
