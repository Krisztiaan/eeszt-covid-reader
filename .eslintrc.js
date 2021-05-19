module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  plugins: ['@typescript-eslint', 'react-native', 'react-hooks', 'jsx-a11y'],
  extends: [
    'airbnb-typescript',
    'airbnb/hooks',
    'prettier/react',
    'prettier/@typescript-eslint',
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    //! disabled, evaluate if we want it, it's slow
    // 'plugin:@typescript-eslint/recommended-requiring-type-checking',
    'plugin:prettier/recommended',
  ],
  settings: {
    react: {
      pragma: 'React',
      version: 'detect',
    },
  },
  parserOptions: {
    project: './tsconfig.eslint.json',
    ecmaVersion: 2021,
    sourceType: 'module',
    ecmaFeatures: {
      jsx: true,
    },
  },
  env: {
    jest: true,
    'react-native/react-native': true,
  },
  globals: {
    __DEV__: true,
  },
  rules: {
    'arrow-body-style': 0,
    'import/prefer-default-export': 0, // just no.
    'import/order': [
      'error',
      {
        'newlines-between': 'always',
        pathGroupsExcludedImportTypes: ['react'],
        pathGroups: [
          {
            pattern: 'react',
            group: 'external',
            position: 'before',
          },
        ],
      },
    ],
    'import/no-extraneous-dependencies': ['off'],
    'import/no-unresolved': ['off'],
    'import/extensions': 0,
    'max-len': ['error', 120],

    // React Hooks
    'react-hooks/exhaustive-deps': 'error',
    'react-hooks/rules-of-hooks': 'error',

    '@typescript-eslint/no-unused-vars': [
      'warn',
      {
        argsIgnorePattern: '^_', // props
        varsIgnorePattern: '^_',
        args: 'after-used',
        ignoreRestSiblings: true,
      },
    ],

    'no-restricted-imports': [
      'warn',
      {
        paths: [
          {
            name: 'react-native',
            importNames: ['Text'],
            message: "Please use Text from 'restyle-components/Text' instead.",
          },
        ],
      },
    ],

    'react/jsx-filename-extension': [1, { extensions: ['tsx'] }],

    'no-use-before-define': 0, // not a big deal
    '@typescript-eslint/no-use-before-define': 0, // not a big deal

    'consistent-return': 0, // not useful with TS taking care of it
    'no-void': 0, // TS is better, void can be used for promises
    '@typescript-eslint/no-namespace': [
      'error',
      { allowDeclarations: true, allowDefinitionFiles: true },
    ], // namespaces can be useful (for types)
    '@typescript-eslint/no-unsafe-assignment': 0, // unreliable and slow rule
    'react/prop-types': 0, // Since we do not use prop-types
    'react/require-default-props': 0, // Since we do not use prop-types
    'react/jsx-props-no-spreading': 0, // Spreading is nice, don't over use
    '@typescript-eslint/unbound-method': 0, // Type definitions rarely define (this: void), maybe warn?

    'react/no-unescaped-entities': ['warn'], // no need to error because of this

    '@typescript-eslint/no-unsafe-member-access': ['off'], // doesn't play well with html parser
    '@typescript-eslint/no-unsafe-call': ['off'], // doesn't play well with html parser

    '@typescript-eslint/consistent-type-imports': ['error', { prefer: 'type-imports' }], // helps avoid cyclic deps

    // these are so that I don't have to fix firebase right now
    '@typescript-eslint/restrict-template-expressions': ['warn'], // no need to panic, but good to note and try to avoid

    'no-underscore-dangle': ['off'],
    'no-console': ['off'],
  },
  overrides: [
    {
      files: ['*.test.ts', '*.test.tsx'],
      rules: {
        // here be rules that are often too much to deal with for tests
        '@typescript-eslint/no-unsafe-return': 0,
        '@typescript-eslint/no-unsafe-call': 0,

        // todo: find out if these are reasonable in tests
        '@typescript-eslint/no-misused-promises': 0,
        '@typescript-eslint/require-await': 0,
      },
    },
    {
      files: ['*Reducer.ts'],
      rules: {
        'no-param-reassign': 0, // mutating in slice with redux toolkit
      },
    },
  ],
};
