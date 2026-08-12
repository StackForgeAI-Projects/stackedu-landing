import { defineConfig } from 'drizzle-kit'

/**
 * Every institution database shares this one schema definition. Generating
 * migrations here and applying them everywhere is what keeps the databases
 * identical.
 */
export default defineConfig({
  schema: './src/db/institution/schema/index.ts',
  out: './drizzle/institution',
  dialect: 'postgresql',
  dbCredentials: {
    url:
      process.env.INSTITUTION_TEMPLATE_DATABASE_URL ??
      'postgres://stackedu:stackedu@localhost:5433/stackedu_inst_template',
  },
  strict: true,
  verbose: true,
})
