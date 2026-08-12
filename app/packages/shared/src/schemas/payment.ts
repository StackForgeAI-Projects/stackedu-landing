import { z } from 'zod'
import { paymentMethodSchema, paymentStatusSchema } from '../enums'
import { isoDateTimeSchema, moneySchema, uuidSchema } from '../primitives'

export const paymentSchema = z.object({
  id: uuidSchema,
  /** Human-readable reference printed on receipts, e.g. PAY-002841. */
  reference: z.string().trim().min(1).max(40),
  studentId: uuidSchema,
  institutionId: uuidSchema,
  amount: moneySchema,
  method: paymentMethodSchema,
  status: paymentStatusSchema,
  receiptUrl: z.string().url().nullable(),
  /** Identifier returned by the payment gateway. */
  gatewayReference: z.string().trim().max(200).nullable(),
  createdAt: isoDateTimeSchema,
})

export type Payment = z.infer<typeof paymentSchema>
