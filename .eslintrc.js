module.exports = {
  parser: '@typescript-eslint/parser',
  plugins: ['@typescript-eslint'],
  overrides: [
    {
        files: ['*.ts'],
        extends: ['standard-with-typescript','plugin:prettier/recommended', 'prettier'],
        parserOptions: {
            ecmaVersion: 2020,
            sourceType: 'module',
            project: './tsconfig.json',
        },
    },
],
}
