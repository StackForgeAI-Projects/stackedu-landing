import { z } from 'zod'
import { gradeSchema } from '../enums'
import { isoDateTimeSchema, uuidSchema } from '../primitives'

export const markSchema = z.object({
  component: z.string().trim().min(1).max(100),
  score: z.number().min(0),
  outOf: z.number().positive(),
  /** Percentage weight this component carries in the final grade. */
  weight: z.number().min(0).max(100),
})

export const resultSchema = z.object({
  studentId: uuidSchema,
  courseId: uuidSchema,
  semesterId: uuidSchema,
  marks: z.array(markSchema),
  grade: gradeSchema,
  gpa: z.number().min(0).max(5),
  publishedAt: isoDateTimeSchema.nullable(),
  publishedBy: uuidSchema.nullable(),
})

export type Mark = z.infer<typeof markSchema>
export type Result = z.infer<typeof resultSchema>
