import swc from 'unplugin-swc';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['test/**/*.spec.ts', 'src/**/*.spec.ts'],
    hookTimeout: 60_000,
    env: {
      JOBS_INLINE: '1',
      DEALBRIDGE_OPEN: '1',
      DEALBRIDGE_ALLOW_FIXTURE_ASR: '1',
      DEALBRIDGE_ALLOW_FIXTURE_MT: '1',
      DEALBRIDGE_ALLOW_FIXTURE_TTS: '1',
      DEALBRIDGE_ALLOW_TEST_ACTORS: '1',
    },
  },
  plugins: [
    swc.vite({
      module: { type: 'es6' },
      jsc: {
        parser: { syntax: 'typescript', decorators: true },
        transform: { legacyDecorator: true, decoratorMetadata: true },
      },
    }),
  ],
});
