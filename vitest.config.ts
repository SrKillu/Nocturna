import { defineConfig } from 'vitest/config';
import path from 'node:path';

/**
 * Vitest configuration for Nocturna.
 *
 *  * Path alias `@/*` mirrors tsconfig.json so tests import the same way as app code.
 *  * `server-only` is aliased to an empty module so modules guarded by it can
 *    still be imported inside unit tests without throwing.
 *  * Two projects:
 *      - unit  → always runs (mock based, fast, no network)
 *      - e2e   → runs only when real Supabase credentials are present.
 *        The e2e suites use `skipIfNoSupabase()` internally, but we also gate
 *        the whole project so CI default `npm test` stays green on empty envs.
 */
export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
      'server-only': path.resolve(__dirname, 'tests/helpers/server-only-shim.ts'),
    },
  },
  test: {
    globals: false,
    environment: 'node',
    include: ['tests/**/*.test.ts'],
    reporters: ['default'],
    testTimeout: 20_000,
    hookTimeout: 20_000,
    pool: 'threads',
    poolOptions: { threads: { singleThread: false } },
    env: {
      NODE_ENV: 'test',
    },
  },
});
