import { defineConfig } from 'vitest/config';

// The filter tests are pure-function tests and don't need a DOM.
// Astro's vitest integration is heavy; we use vanilla vitest since filter.ts is pure.
export default defineConfig({
  test: {
    environment: 'node',
    include: ['tests/**/*.test.ts'],
  },
});
