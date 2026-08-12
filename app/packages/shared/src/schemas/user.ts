import { z } from 'zod'
import { userRoleSchema } from '../enums'
import { emailSchema, isoDateTimeSchema, phoneSchema, uuidSchema } from '../primitives'

export const userSchema = z.object({
  id: uuidSchema,
  role: userRoleSchema,
  institutionId: uuidSchema,
  email: emailSchema,
  phone: phoneSchema,
  fullName: z.string().trim().min(1).max(200),
  isActive: z.boolean(),
  createdAt: isoDateTimeSchema,
})

export type User = z.infer<typeof userSchema>
