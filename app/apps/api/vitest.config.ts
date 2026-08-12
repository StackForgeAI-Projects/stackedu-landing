import { defineConfig } from 'vitest/config'
import path from 'node:path'

export default defineConfig({
  resolve: {
    alias: { '@': path.resolve(__dirname, './src') },
  },
  test: {
    environment: 'node',
    globals: false,
    // Tenancy tests provision real databases; give them room and keep files
    // sequential so they do not race on the same Postgres server.
    testTimeout: 60_000,
    hookTimeout: 120_000,
    fileParallelism: false,
    include: ['tests/**/*.test.ts'],
  },
})
