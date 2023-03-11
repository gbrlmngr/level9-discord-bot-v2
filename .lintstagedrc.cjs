module.exports = {
  'src/**/*.{ts,js,cjs,mjs}': ['prettier --write', 'eslint --fix'],
  'src/**/*.{json,md}': ['prettier --write'],
};
