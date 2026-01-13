import { defineConfig } from 'vitest/config';
import { config as dotenv } from 'dotenv';
import path from 'node:path';

dotenv({ path: path.resolve(__dirname, '.env.test') });

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,

    include: ['src/**/*.test.ts'],

    exclude: ['**/node_modules/**', '**/.git/**'],

    setupFiles: ['src/__tests__/setup.ts'],
  },
});
