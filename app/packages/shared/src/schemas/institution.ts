import { z } from 'zod'
import { institutionStatusSchema } from '../enums'
import { emailSchema, isoDateTimeSchema, slugSchema, uuidSchema } from '../primitives'

/**
 * Institutions live in the small shared platform database. Everything else
 * about an institution lives in that institution's own database.
 */
export const institutionSchema = z.object({
  id: uuidSchema,
  name: z.string().trim().min(2).max(200),
  /** Also used to derive the database name, so it must stay URL and SQL safe. */
  slug: slugSchema,
  shortName: z.string().trim().min(2).max(20),
  status: institutionStatusSchema,
  contactEmail: emailSchema,
  /** IANA timezone, e.g. Africa/Kigali. */
  timezone: z.string().trim().min(1).max(64),
  locale: z.enum(['en', 'fr', 'rw']),
  createdAt: isoDateTimeSchema,
})

export const createInstitutionSchema = institutionSchema
  .pick({ name: true, slug: true, shortName: true, contactEmail: true })
  .extend({
    timezone: institutionSchema.shape.timezone.default('Africa/Kigali'),
    locale: institutionSchema.shape.locale.default('en'),
  })

export type Institution = z.infer<typeof institutionSchema>
export type CreateInstitutionInput = z.input<typeof createInstitutionSchema>
