import { defineConfig } from 'vitest/config';
import { config as dotenv } from 'dotenv';
import path from 'node:path';

dotenv({ path: path.resolve(__dirname, '.env.test'), override: true });

const dbUrl = process.env.DATABASE_URL ?? '';
const usesSqliteTestDb = dbUrl.includes('test.db');

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    include: ['src/**/*.test.ts'],
    exclude: ['**/node_modules/**', '**/.git/**'],
    setupFiles: ['src/__tests__/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json-summary', 'lcov'],
      include: ['src/**/*.ts'],
      exclude: [
        'src/**/*.test.ts',
        'src/**/__tests__/**',

        'src/server.ts',
        'src/server-context.ts',
        'src/repositories/**',
        'src/lib/**',
        'src/errors/format-graphql-error.ts',

        'src/**/generated/**',
        'src/**/types/**',
        'src/index.ts',
      ],
      thresholds: {
        lines: 85,
        functions: 85,
        branches: 70,
        statements: 85,
      },
    },

    // Critical: sqlite file cannot be shared between parallel test files
    ...(usesSqliteTestDb
      ? {
          fileParallelism: false,
          maxConcurrency: 1,
          sequence: { concurrent: false },
        }
      : {}),
  },
});
