// @ts-check
import eslint from '@eslint/js';
import eslintPluginPrettierRecommended from 'eslint-plugin-prettier/recommended';
import globals from 'globals';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  {
    ignores: ['eslint.config.mjs'],
  },
  eslintPluginPrettierRecommended,
  {
    files: ['**/*.ts'], // ✅ Apply to all .ts files
    plugins: {
      '@typescript-eslint': tseslint.plugin, // ✅ Register the plugin
    },
    languageOptions: {
      parser: tseslint.parser, // ✅ Explicitly set parser
      globals: {
        ...globals.node,
        ...globals.jest,
      },
      ecmaVersion: 2020,
      sourceType: 'module',
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-unused-vars': [
        'warn',
        { args: 'none', varsIgnorePattern: '^_' },
      ],
      '@typescript-eslint/no-unused-expressions': 'error',
      'no-console': ['warn', { allow: ['warn', 'error', 'time', 'timeEnd'] }],
    },
  }
);
