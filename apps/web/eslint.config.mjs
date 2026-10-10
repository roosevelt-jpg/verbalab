import nextjsConfig from '@lugemi/eslint-config/nextjs';

/** @type {import('eslint').Linter.Config[]} */
export default [
  ...nextjsConfig,
  {
    ignores: ['next-env.d.ts', '.next/**'],
  },
];
