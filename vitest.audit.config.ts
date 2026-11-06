import { defineConfig } from 'vitest/config';

/** Long-running matching audits (calibration, coverage); never part of `npm test`. */
export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['src/**/*.audit.ts'],
    testTimeout: 3_600_000,
  },
});
