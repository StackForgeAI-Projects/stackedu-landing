import { z } from 'zod'
import { uuidSchema } from '../primitives'

export const courseSchema = z.object({
  id: uuidSchema,
  /** Institution-facing code such as SE401. */
  code: z.string().trim().min(2).max(20),
  name: z.string().trim().min(1).max(200),
  credits: z.number().int().min(1).max(30),
  department: z.string().trim().min(1).max(200),
  lecturerId: uuidSchema.nullable(),
  prerequisiteIds: z.array(uuidSchema),
  semesterId: uuidSchema,
  institutionId: uuidSchema,
})

export type Course = z.infer<typeof courseSchema>
