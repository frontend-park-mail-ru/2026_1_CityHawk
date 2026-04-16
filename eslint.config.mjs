import js from '@eslint/js';
import globals from 'globals';

export default [
  {
    ignores: ['dist/**', 'server-dist/**', 'node_modules/**', 'public/static/**'],
  },
  js.configs.recommended,
  {
    files: ['src/**/*.js', 'public/**/*.js'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: {
        ...globals.browser,
      },
    },
  },
  {
    files: ['server/**/*.js', '*.config.js', 'webpack.config.js'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'script',
      globals: {
        ...globals.node,
      },
    },
  },
];
