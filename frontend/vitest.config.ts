import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    exclude: [
      '**/node_modules/**',
      '**/dist/**',
      '**/tests/**', // Exclude Playwright tests
      '**/*.spec.ts' // Exclude Playwright spec files
    ]
  }
});
