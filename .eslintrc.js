module.exports = {
  ignorePatterns: [
    '.eslintrc.js',
    'webpack.*',
    'dist/*',
    '*.config.js'
  ],
  extends: ['airbnb-typescript/base'],
  parser: '@typescript-eslint/parser',
  plugins: ['@typescript-eslint'],
  parserOptions: {
    project: './tsconfig.json',
  },
  env: {
    node: true
  },
  settings: {
    'import/resolver': {
      'node': {
        'extensions': ['.js', '.ts', '.vue', '.tsx', '.jsx']
      },
      [require.resolve('eslint-import-resolver-webpack')]: {
        config: require.resolve('./webpack.config.js'),
      },
    }
  },
  rules: {
    'no-console': 'off'
  }
}