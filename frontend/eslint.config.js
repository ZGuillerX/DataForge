import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    rules: {
      // Loading data in useEffect based on route/query params is the
      // pattern used throughout this app's pages; downgraded instead of
      // rewriting every page's data fetching to satisfy this rule.
      'react-hooks/set-state-in-effect': 'warn',
      // AuthContext intentionally exports both the provider and the
      // useAuth() hook from the same file.
      'react-refresh/only-export-components': 'warn',
    },
  },
])
