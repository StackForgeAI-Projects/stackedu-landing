import { z } from 'zod'
import { resourceTypeSchema } from '../enums'
import { isoDateTimeSchema, uuidSchema } from '../primitives'

/** An empty array means "no restriction on this dimension". */
export const accessScopeSchema = z.object({
  programmes: z.array(z.string().trim()),
  departments: z.array(z.string().trim()),
  yearGroups: z.array(z.number().int().min(1).max(8)),
})

export const libraryResourceSchema = z.object({
  id: uuidSchema,
  title: z.string().trim().min(1).max(300),
  author: z.string().trim().max(300),
  isbn: z.string().trim().max(20).optional(),
  type: resourceTypeSchema,
  subjectTags: z.array(z.string().trim()),
  accessScope: accessScopeSchema,
  /** Object key in Cloudflare R2, never a public URL — links are signed on demand. */
  fileKey: z.string().trim().min(1).max(500),
  uploadedBy: uuidSchema,
  institutionId: uuidSchema,
  createdAt: isoDateTimeSchema,
})

export type AccessScope = z.infer<typeof accessScopeSchema>
export type LibraryResource = z.infer<typeof libraryResourceSchema>
