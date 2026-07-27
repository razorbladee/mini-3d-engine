import js from '@eslint/js';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  { ignores: ['dist/**', 'coverage/**', 'node_modules/**'] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ['**/*.ts'],
    languageOptions: {
      parserOptions: { ecmaVersion: 2022, sourceType: 'module' },
    },
    rules: {
      'max-len': ['error', { code: 120, ignoreUrls: true, ignoreStrings: true, ignoreTemplateLiterals: true }],
      eqeqeq: ['error', 'always'],
      'no-console': ['warn', { allow: ['warn', 'error'] }],
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      '@typescript-eslint/no-non-null-assertion': 'warn',
    },
  },
  {
    files: ['src/**/*.ts'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/explicit-module-boundary-types': 'off',
    },
  },
  {
    files: ['examples/**/*.ts', 'tests/**/*.ts', '*.config.ts', '*.config.js'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'warn',
    },
  },
  // Technical debt, tracked in docs/AUDIT-TZ.md. These two modules are rewritten
  // in stages 4-5 (typed glTF schema, typed uniform table); until then their
  // `any` usage is downgraded rather than silenced, so it stays greppable.
  {
    files: ['src/loaders/GLTFLoader.ts', 'src/rendering/WebGLRenderer.ts'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'warn',
    },
  },
);
