import js from '@eslint/js';
import eslintConfigPrettier from 'eslint-config-prettier';
import tseslint from 'typescript-eslint';

/** @type {import('eslint').Linter.Config[]} */
export const base = [
  js.configs.recommended,
  ...tseslint.configs.recommended,
  eslintConfigPrettier,
  {
    ignores: ['**/dist/**', '**/.next/**', '**/coverage/**', '**/node_modules/**'],
  },
];
