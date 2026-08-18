import { z } from 'zod'

/** Shared building blocks so validation rules are written once, not per entity. */

export const uuidSchema = z.string().uuid()

export const isoDateTimeSchema = z.string().datetime({ offset: true })

/** Calendar date with no time component, e.g. a date of birth. */
export const isoDateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Expected YYYY-MM-DD')

export const emailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .email('Email address is not valid.')
  .max(255, 'Email address is too long.')

/**
 * Rwandan numbers are stored in full international form so SMS providers and
 * mobile money gateways receive exactly what they expect.
 */
export const phoneSchema = z
  .string()
  .trim()
  .regex(
    /^\+[1-9]\d{7,14}$/,
    'Phone number must be in international format, e.g. +250788123456.',
  )

/**
 * Money is always a whole number of Rwandan Francs. Never a float — decimals
 * cause rounding errors that turn into disputes with students.
 */
export const moneySchema = z
  .number()
  .int('Amount must be a whole number of Rwandan Francs')
  .nonnegative()

/** URL-safe identifier used for institution slugs and database naming. */
export const slugSchema = z
  .string()
  .trim()
  .toLowerCase()
  .min(2)
  .max(40)
  .regex(/^[a-z][a-z0-9-]*[a-z0-9]$/, 'Use lowercase letters, numbers and hyphens')

export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(25),
})

export type Pagination = z.infer<typeof paginationSchema>
