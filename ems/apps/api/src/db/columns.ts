import { bigint, timestamp, uuid } from 'drizzle-orm/pg-core'
import { sql } from 'drizzle-orm'

/**
 * Column shapes that repeat across nearly every table. Defining them once
 * keeps the schema consistent and makes a global change a one-line edit.
 */

export const primaryKeyColumn = () => uuid('id').primaryKey().defaultRandom()

export const createdAtColumn = () =>
  timestamp('created_at', { withTimezone: true, mode: 'string' })
    .notNull()
    .default(sql`now()`)

export const updatedAtColumn = () =>
  timestamp('updated_at', { withTimezone: true, mode: 'string' })
    .notNull()
    .default(sql`now()`)
    .$onUpdate(() => sql`now()` as unknown as string)

export const timestamps = () => ({
  createdAt: createdAtColumn(),
  updatedAt: updatedAtColumn(),
})

/**
 * Money is a whole number of Rwandan Francs, stored as bigint.
 *
 * A 32-bit integer caps at about 2.1 billion, and an institution's yearly fee
 * income in RWF passes that comfortably, so int4 would silently overflow.
 */
export const money = (name: string) => bigint(name, { mode: 'number' })
