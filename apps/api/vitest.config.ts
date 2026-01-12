import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,

    include: [
      'src/**/*.test.ts',
      'src/**/*.unit.test.ts',
    ],

    exclude: ['**/node_modules/**', '**/.git/**'],

    setupFiles: process.env.NODE_ENV === 'test'
      ? ['src/__tests__/integration/setup.ts']
      : [],
  },
});
