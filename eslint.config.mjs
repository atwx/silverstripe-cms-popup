import js from '@eslint/js';
import reactPlugin from 'eslint-plugin-react';
import reactHooksPlugin from 'eslint-plugin-react-hooks';
import globals from 'globals';

export default [
  js.configs.recommended,
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
    rules: {
      ...reactPlugin.configs.recommended.rules,
      ...reactHooksPlugin.configs.recommended.rules,

      // React 17+ JSX transform – no need to import React in scope
      'react/react-in-jsx-scope': 'off',

      // PropTypes are used throughout; keep the check
      'react/prop-types': 'warn',

      // console.log leaks: warn so existing console.warn calls survive CI
      'no-console': ['warn', { allow: ['warn', 'error'] }],

      // Code style
      'no-var': 'error',
      'prefer-const': 'error',
      'eqeqeq': ['error', 'always'],
      'no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    },
    settings: {
      react: { version: 'detect' },
    },
  },
  // Ignore compiled output and config files
  {
    ignores: ['client/dist/**', 'vendor/**', 'node_modules/**'],
  },
];
