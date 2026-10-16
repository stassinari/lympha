const expoConfig = require('eslint-config-expo/flat');
const prettier = require('eslint-config-prettier');

module.exports = [
  {
    // The design bundle is a reference artefact, not source. It is HTML with a
    // bundled runtime and is never compiled into the app.
    // The design-sync converter and its output are generated, not source.
    ignores: [
      'node_modules/',
      '.expo/',
      'dist/',
      'docs/',
      '.ds-sync/',
      'ds-bundle/',
      '.design-sync/.cache/',
    ],
  },
  ...expoConfig,
  prettier,
  {
    // Design-sync previews import the bundled design system as the package
    // `lympha`, which resolves only inside the converter's build.
    files: ['.design-sync/previews/**'],
    rules: { 'import/no-unresolved': ['error', { ignore: ['^lympha$'] }] },
  },
];
