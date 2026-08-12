import { defineConfig } from 'drizzle-kit'

export default defineConfig({
  schema: './src/db/platform/schema.ts',
  out: './drizzle/platform',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.PLATFORM_DATABASE_URL ?? 'postgres://stackedu:stackedu@localhost:5433/stackedu_platform',
  },
  strict: true,
  verbose: true,
})
