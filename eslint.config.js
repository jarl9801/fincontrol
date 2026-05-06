import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{js,jsx}'],
    extends: [
      js.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
      parserOptions: {
        ecmaVersion: 'latest',
        ecmaFeatures: { jsx: true },
        sourceType: 'module',
      },
    },
    rules: {
      'no-unused-vars': ['error', { varsIgnorePattern: '^[A-Z_]' }],
    },
  },
  {
    files: ['src/components/ui/nexus/**/*.{js,jsx}'],
    rules: {
      'no-restricted-syntax': [
        'error',
        {
          selector: 'Literal[value=/\\b(nd-|n-label|n-mono|n-tag)\\b|var\\(--(surface|surface-raised|text-primary|text-secondary|text-disabled|accent|border|success|warning|error|info)\\)/]',
          message: 'NEXUS components must use canonical utilities and --color-* tokens, not compatibility aliases.',
        },
        {
          selector: 'TemplateElement[value.raw=/\\b(nd-|n-label|n-mono|n-tag)\\b|var\\(--(surface|surface-raised|text-primary|text-secondary|text-disabled|accent|border|success|warning|error|info)\\)/]',
          message: 'NEXUS components must use canonical utilities and --color-* tokens, not compatibility aliases.',
        },
      ],
    },
  },
])
