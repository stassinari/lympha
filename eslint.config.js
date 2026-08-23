const expoConfig = require('eslint-config-expo/flat');
const prettier = require('eslint-config-prettier');

module.exports = [
  {
    // The design bundle is a reference artefact, not source. It is HTML with a
    // bundled runtime and is never compiled into the app.
    ignores: ['node_modules/', '.expo/', 'dist/', 'docs/'],
  },
  ...expoConfig,
  prettier,
];
