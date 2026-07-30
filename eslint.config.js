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
      globals: globals.browser,
    },
    rules: {
      // Treat a leading underscore as "deliberately unused" for params, locals
      // and caught errors. The codebase already uses this convention (_sport,
      // _authUid) for arguments kept to satisfy a signature.
      '@typescript-eslint/no-unused-vars': ['error', {
        args: 'all',
        argsIgnorePattern: '^_',
        varsIgnorePattern: '^_',
        caughtErrors: 'all',
        caughtErrorsIgnorePattern: '^_',
        destructuredArrayIgnorePattern: '^_',
        ignoreRestSiblings: true,
      }],

      // TEMPORARY — tracked debt, do not leave in place.
      //
      // There are 76 `any` annotations across the data layer (hooks, services,
      // stores, AuthContext). They cannot be typed correctly yet: the canonical
      // snake_case Appwrite schema and the FastAPI response envelope are what
      // define these shapes, and typing them against the current mockData
      // shapes would bake in types that are about to change.
      //
      // Downgraded to a warning so real errors stay visible in CI. Each `any`
      // is removed as its module is migrated to the real API types; delete this
      // override once the count reaches zero.
      '@typescript-eslint/no-explicit-any': 'warn',
    },
  },
])
