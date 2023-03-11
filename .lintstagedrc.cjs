module.exports = {
  '*.{ts,js,cjs,mjs}': ['prettier --write', 'eslint --fix'],
  '*.{json,md}': ['prettier --write'],
};
