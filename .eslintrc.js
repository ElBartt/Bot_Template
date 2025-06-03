// Define constants to avoid magic numbers in ESLint config
const MAX_LINE_LENGTH = 120;
const MAX_COMPLEXITY = 20;
const MAX_DEPTH = 4;
const MAX_PARAMS = 5;
const MAX_LINES_PER_FUNCTION = 50;
const MAX_NESTED_CALLBACKS = 3;
const MAX_STATEMENTS = 30;
const INDENT_SIZE = 4;
const SWITCH_CASE_INDENT = 1;
const COMMON_NUMBERS = [-1, 0, 1]; // Common numbers to ignore in no-magic-numbers rule

module.exports = {
    env: {
        node: true,
        commonjs: true,
        es2021: true,
    },
    extends: [
        'eslint:recommended',
        'plugin:node/recommended',
        'plugin:promise/recommended'
    ],
    parserOptions: {
        ecmaVersion: 'latest',
    },
    plugins: [
        'node',
        'promise',
        'security'
    ],
    rules: {
        // Error prevention
        'no-unused-vars': ['warn', {
            argsIgnorePattern: '^_',
            destructuredArrayIgnorePattern: '^_'
        }],
        'no-console': 'warn',
        'no-undef': 'error',
        'no-var': 'error',
        'no-duplicate-imports': 'error',
        'no-template-curly-in-string': 'warn',
        'no-unused-expressions': 'error',
        'no-return-await': 'error', // Unnecessary return await
        'require-atomic-updates': 'error', // Style consistency
        'indent': ['error', INDENT_SIZE, { 'SwitchCase': SWITCH_CASE_INDENT }],
        'linebreak-style': process.env.CI ? 'off' : ['error', process.platform === 'win32' ? 'windows' : 'unix'],
        'quotes': ['error', 'single', { 'avoidEscape': true }],
        'semi': ['error', 'always'],
        'camelcase': ['error', { properties: 'never' }],
        'comma-dangle': ['error', 'only-multiline'],
        'comma-spacing': ['error', { before: false, after: true }],
        'consistent-return': 'error',
        'key-spacing': ['error', { beforeColon: false, afterColon: true }],
        'no-trailing-spaces': 'error',
        'object-curly-spacing': ['error', 'always'],
        'space-in-parens': ['error', 'never'],
        'spaced-comment': ['error', 'always'],
        'no-multiple-empty-lines': ['error', { 'max': 1 }],

        // Best practices
        'eqeqeq': ['error', 'always'],
        'curly': ['error', 'all'],
        'prefer-const': 'error',
        'arrow-body-style': ['error', 'always'],
        'array-callback-return': 'error',
        'default-param-last': 'error',
        'dot-notation': 'error',
        'no-else-return': 'error',
        'no-floating-decimal': 'error',
        'no-implicit-coercion': 'error',
        'no-multi-spaces': 'error',
        'no-useless-return': 'error',
        'prefer-destructuring': ['error', {
            'array': false,
            'object': true
        }],
        'prefer-spread': 'error',
        'prefer-template': 'error',
        'yoda': 'error',

        // Code quality
        'max-len': ['warn', {
            'code': MAX_LINE_LENGTH,
            'ignoreStrings': true,
            'ignoreTemplateLiterals': true,
            'ignoreComments': true
        }],
        'complexity': ['warn', MAX_COMPLEXITY],
        'max-depth': ['warn', MAX_DEPTH],
        'max-params': ['warn', MAX_PARAMS],
        'max-lines-per-function': ['warn', {
            max: MAX_LINES_PER_FUNCTION,
            skipBlankLines: true,
            skipComments: true
        }],
        'max-nested-callbacks': ['warn', MAX_NESTED_CALLBACKS],
        'max-statements': ['warn', MAX_STATEMENTS],
        'no-magic-numbers': ['warn', {
            ignore: COMMON_NUMBERS,
            ignoreArrayIndexes: true
        }],

        // Node.js specific
        'no-process-exit': 'warn',
        'no-path-concat': 'error',
        'node/no-deprecated-api': 'error',
        'node/no-extraneous-require': 'error',
        'node/no-missing-require': 'error',

        // Async/Promise handling
        'promise/always-return': 'error',
        'promise/no-return-wrap': 'error',
        'promise/param-names': 'error',
        'promise/catch-or-return': 'error',
        'promise/no-native': 'off',
        'promise/no-callback-in-promise': 'warn',
        'promise/no-promise-in-callback': 'warn',
        'promise/avoid-new': 'off',

        // Security
        'security/detect-object-injection': 'warn',
        'security/detect-non-literal-regexp': 'warn',
        'security/detect-possible-timing-attacks': 'error',
    },
};
