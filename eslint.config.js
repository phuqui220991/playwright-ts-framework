const tsParser = require('@typescript-eslint/parser');
const tsPlugin = require('@typescript-eslint/eslint-plugin');
const playwright = require('eslint-plugin-playwright');
const prettierConfig = require('eslint-config-prettier');

module.exports = [
    {
        ignores: [
            'node_modules/**',
            'playwright-report/**',
            'test-results/**',
            'blob-report/**',
            'playwright/.cache/**',
            'auth/**',
        ],
    },
    {
        files: ['**/*.ts'],
        languageOptions: {
            parser: tsParser,
            parserOptions: {
                project: './tsconfig.json',
            },
        },
        plugins: {
            '@typescript-eslint': tsPlugin,
        },
        rules: {
            ...tsPlugin.configs.recommended.rules,
            '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
            '@typescript-eslint/explicit-module-boundary-types': 'off',
            'no-console': ['warn', { allow: ['warn', 'error'] }],
        },
    },
    {
        files: ['tests/**/*.ts'],
        plugins: {
            playwright,
        },
        rules: {
            ...playwright.configs['flat/recommended'].rules,
        },
    },
    prettierConfig,
];
