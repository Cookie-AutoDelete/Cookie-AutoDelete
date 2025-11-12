// @ts-check
import eslint from '@eslint/js';
import prettier from 'eslint-config-prettier/flat';
import react from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';
import { globalIgnores, defineConfig } from 'eslint/config';
import globals from 'globals';
import tsEslint from 'typescript-eslint';

export default defineConfig(
  globalIgnores(['./coverage/']),
  {
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.jest,
        ...globals.webextensions,
        ...globals.node,
        ...globals.es2024,
      },
      parserOptions: {
        ecmaVersion: 2024,
        sourceType: 'module',
      },
    },
    settings: {
      react: {
        version: 'detect',
      },
    },
  },

  {
    files: ['src/**/*.{ts,tsx}'],
    extends: [
      eslint.configs.recommended,
      tsEslint.configs.strict,
      react.configs.flat.recommended,
      reactHooks.configs.flat.recommended,
      prettier,
    ],

    rules: {
      // eslint rules
      'no-console': 'warn',

      // @typescript-eslint rules
      '@typescript-eslint/no-unused-expressions': [
        'error',
        { allowShortCircuit: true },
      ],
      '@typescript-eslint/no-non-null-assertion': 'off',
      '@typescript-eslint/no-unused-vars': ['warn', { caughtErrors: 'none' }],
      '@typescript-eslint/no-explicit-any': 'off', // Maybe set to 'warn' later

      // react rules
      'react/jsx-uses-react': 'off',
      'react/prop-types': 'off',
      'react/react-in-jsx-scope': 'off',
    },
  },
);
