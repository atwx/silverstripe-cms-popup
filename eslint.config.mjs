import js from '@eslint/js';
import reactPlugin from 'eslint-plugin-react';
import reactHooksPlugin from 'eslint-plugin-react-hooks';
import globals from 'globals';

export default [
  // Ignore compiled output
  {
    ignores: ['client/dist/**', 'vendor/**', 'node_modules/**'],
  },

  // ── Production source files ────────────────────────────────────────────────
  {
    files: ['client/src/**/*.js'],
    plugins: {
      react: reactPlugin,
      'react-hooks': reactHooksPlugin,
    },
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: {
        ...globals.browser,
        ...globals.es2022,
      },
      parserOptions: {
        ecmaFeatures: { jsx: true },
      },
    },
    linterOptions: {
      // Existing source files use `// eslint-disable-next-line` for legitimate
      // reasons (dangerouslySetInnerHTML, webpack-resolved bare imports).
      // Don't error on directives that silence rules we haven't enabled yet.
      reportUnusedDisableDirectives: 'off',
    },
    rules: {
      ...reactPlugin.configs.recommended.rules,
      ...reactHooksPlugin.configs.recommended.rules,

      // React 17+ JSX transform – no need to import React for JSX
      'react/react-in-jsx-scope': 'off',

      // dangerouslySetInnerHTML must be explicitly suppressed per usage
      'react/no-danger': 'error',

      // PropTypes are used throughout; keep the check
      'react/prop-types': 'warn',

      // Code style
      'no-var': 'error',
      'prefer-const': 'error',
      'eqeqeq': ['error', 'always'],
      'no-unused-vars': ['error', { argsIgnorePattern: '^_', caughtErrorsIgnorePattern: '^_' }],
      'no-console': 'error',
    },
    settings: {
      react: { version: 'detect' },
    },
  },

  // ── Jest test files ────────────────────────────────────────────────────────
  {
    files: ['client/src/**/__tests__/**/*.test.js'],
    languageOptions: {
      globals: {
        ...globals.jest,
      },
    },
    rules: {
      // Tests often need console for debugging; keep it lenient
      'no-console': 'warn',
    },
  },

  // ── CommonJS mock/stub files ───────────────────────────────────────────────
  {
    files: ['client/src/__mocks__/**/*.js'],
    languageOptions: {
      sourceType: 'commonjs',
      globals: {
        ...globals.node,
      },
    },
  },
];
