import { eq } from 'drizzle-orm'
import type { z } from 'zod'
import type { InstitutionDb } from '../db/connection'
import { institutionSettings } from '../db/institution/schema/settings'

export async function readInstitutionSetting<T>(
  db: InstitutionDb,
  key: string,
  schema: z.ZodType<T>,
  fallback: T,
): Promise<T> {
  const [row] = await db
    .select({ value: institutionSettings.value })
    .from(institutionSettings)
    .where(eq(institutionSettings.key, key))
    .limit(1)
  if (!row) return fallback
  const parsed = schema.safeParse(row.value)
  return parsed.success ? parsed.data : fallback
}

export async function upsertInstitutionSetting(
  db: InstitutionDb,
  key: string,
  value: unknown,
  meta: { category: string; description: string },
  updatedBy?: string,
): Promise<void> {
  const [existing] = await db
    .select({ id: institutionSettings.id })
    .from(institutionSettings)
    .where(eq(institutionSettings.key, key))
    .limit(1)

  if (existing) {
    await db
      .update(institutionSettings)
      .set({
        value,
        updatedBy: updatedBy ?? null,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(institutionSettings.id, existing.id))
    return
  }

  await db.insert(institutionSettings).values({
    key,
    value,
    category: meta.category,
    description: meta.description,
    updatedBy: updatedBy ?? null,
  })
}
