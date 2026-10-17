#!/usr/bin/env node
/**
 * Builds the design system as a web React package for the design-sync converter.
 *
 *   node .design-sync/web/build.mjs
 *
 * Output, in `.design-sync/.cache/web-pkg/`:
 *   dist/index.js  ESM, everything bundled except React
 *   types/         declarations, with `@/` paths made relative
 *   package.json   points the converter at both
 *
 * and per-component docs in `.design-sync/.cache/docs/` — see `docs.mjs`.
 *
 * React Native runs in the browser through react-native-web. The substitutions:
 *   react-native        → ./react-native.ts (react-native-web, reporting iOS)
 *   NativeSheet         → ./NativeSheet.tsx (the platform sheets are native code)
 *   src/state/store     → ./store.tsx (a store per design, not one persisted
 *                         singleton)
 *   expo-haptics,
 *   expo-status-bar,
 *   RN asset registry   → ./stubs.ts
 *
 * esbuild comes from the converter's staging dir, `.ds-sync/node_modules`.
 */

import { execFileSync } from 'node:child_process';
import {
  cpSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  rmSync,
  statSync,
  writeFileSync,
} from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const WEB = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(WEB, '../..');
const OUT = join(ROOT, '.design-sync/.cache/web-pkg');
const SRC = join(ROOT, 'src');

const { build } = createRequire(join(ROOT, '.ds-sync/package.json'))('esbuild');

rmSync(OUT, { recursive: true, force: true });

// -- declarations ----------------------------------------------------------

execFileSync('npx', ['tsc', '-p', join(WEB, 'tsconfig.json')], { cwd: ROOT, stdio: 'inherit' });

const RAW = join(OUT, 'types-raw');
const TYPES = join(OUT, 'types');

/** Where a declaration emitted for repo file `rel` (no extension) lands in types/. */
function placed(rel) {
  if (rel === '.design-sync/web/index') return 'index';
  if (rel.startsWith('.design-sync/web/')) return 'web/' + rel.slice('.design-sync/web/'.length);
  return rel;
}

function walkDts(dir) {
  return readdirSync(dir).flatMap((f) => {
    const p = join(dir, f);
    if (statSync(p).isDirectory()) return walkDts(p);
    return p.endsWith('.d.ts') ? [p] : [];
  });
}

for (const file of walkDts(RAW)) {
  const rel = relative(RAW, file).replace(/\.d\.ts$/, '');
  const target = join(TYPES, placed(rel) + '.d.ts');
  const source = readFileSync(file, 'utf8').replace(
    /(from\s+|import\()(['"])([^'"]+)\2/g,
    (match, lead, quote, spec) => {
      let original;
      if (spec.startsWith('@/')) original = 'src/' + spec.slice(2);
      else if (spec.startsWith('.')) original = relative(ROOT, resolve(ROOT, dirname(rel), spec));
      else return match;
      let next = relative(dirname(target), join(TYPES, placed(original)));
      if (!next.startsWith('.')) next = './' + next;
      return `${lead}${quote}${next}${quote}`;
    },
  );
  mkdirSync(dirname(target), { recursive: true });
  writeFileSync(target, source);
}
rmSync(RAW, { recursive: true, force: true });

// The hand-written platform declaration is not emitted by tsc.
cpSync(
  join(SRC, 'design/primitives/NativeSheet.d.ts'),
  join(TYPES, 'src/design/primitives/NativeSheet.d.ts'),
);

// -- bundle ----------------------------------------------------------------

const substitutions = {
  name: 'lympha-web',
  setup(b) {
    b.onResolve({ filter: /^react-native$/ }, () => ({ path: join(WEB, 'react-native.ts') }));
    b.onResolve(
      { filter: /^(expo-haptics|expo-status-bar|@react-native\/assets-registry\/registry)$/ },
      () => ({
        path: join(WEB, 'stubs.ts'),
      }),
    );
    b.onResolve({ filter: /\/NativeSheet$/ }, (args) =>
      args.importer.startsWith(join(SRC, 'design/primitives'))
        ? { path: join(WEB, 'NativeSheet.tsx') }
        : undefined,
    );
    // react-native-web's `<style id="react-native-stylesheet">` is filled through
    // `insertRule`, so its markup is empty, and its id matches the `[id^="r"]` the
    // converter's render check uses to find preview roots — every card then reads
    // as unrendered. The id is internal to react-native-web; renaming it changes
    // nothing else.
    b.onLoad(
      { filter: /react-native-web\/dist\/exports\/StyleSheet\/dom\/index\.js$/ },
      (args) => ({
        contents: readFileSync(args.path, 'utf8').replace(
          "'react-native-stylesheet'",
          "'lympha-stylesheet'",
        ),
        loader: 'js',
        resolveDir: dirname(args.path),
      }),
    );
    b.onResolve({ filter: /^\.\/store$/ }, (args) =>
      args.importer.startsWith(join(SRC, 'state')) ? { path: join(WEB, 'store.tsx') } : undefined,
    );
    b.onResolve({ filter: /^@\// }, (args) =>
      b.resolve('./' + args.path.slice(2), { resolveDir: SRC, kind: args.kind }),
    );
  },
};

await build({
  entryPoints: [join(WEB, 'index.ts')],
  outfile: join(OUT, 'dist/index.js'),
  bundle: true,
  format: 'esm',
  platform: 'browser',
  target: 'es2020',
  jsx: 'automatic',
  external: ['react', 'react-dom', 'react/jsx-runtime', 'react-dom/client'],
  resolveExtensions: [
    '.web.tsx',
    '.web.ts',
    '.web.js',
    '.tsx',
    '.ts',
    '.jsx',
    '.js',
    '.mjs',
    '.json',
  ],
  mainFields: ['browser', 'module', 'main'],
  loader: { '.js': 'jsx' },
  define: {
    __DEV__: 'false',
    'process.env.NODE_ENV': '"production"',
    'process.env.EXPO_OS': '"ios"',
    global: 'globalThis',
  },
  plugins: [substitutions],
  logLevel: 'warning',
});

// -- package ---------------------------------------------------------------

const app = JSON.parse(readFileSync(join(ROOT, 'app.json'), 'utf8')).expo;
writeFileSync(
  join(OUT, 'package.json'),
  JSON.stringify(
    { name: 'lympha', version: app.version, module: 'dist/index.js', types: 'types/index.d.ts' },
    null,
    2,
  ) + '\n',
);

// -- docs ------------------------------------------------------------------

const { writeDocs } = await import('./docs.mjs');
const count = await writeDocs({ root: ROOT, out: join(ROOT, '.design-sync/.cache/docs'), build });

console.log(`built ${relative(ROOT, OUT)}, ${count} docs`);
