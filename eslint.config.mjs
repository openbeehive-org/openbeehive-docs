// ESLint flat config for the site's own code: docusaurus.config.ts, sidebars.ts and src/.
import {defineConfig, globalIgnores} from 'eslint/config';
import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import reactHooks from 'eslint-plugin-react-hooks';
import prettier from 'eslint-config-prettier';
import globals from 'globals';

export default defineConfig(
  globalIgnores(['build/', '.docusaurus/', 'node_modules/']),
  js.configs.recommended,
  tseslint.configs.recommended,
  {
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: {...globals.browser, ...globals.node},
    },
    rules: {
      'no-console': ['error', {allow: ['error', 'warn']}],
    },
  },
  {
    files: ['src/**/*.{js,jsx,ts,tsx}'],
    extends: [reactHooks.configs.flat.recommended],
  },
  prettier,
);
