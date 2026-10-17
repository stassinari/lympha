/**
 * Per-component docs for the design-sync converter, which turns each into the
 * component's `.prompt.md` — what Claude Design's agent reads before using it.
 *
 * Everything comes from the repo:
 *   description  the source file's header comment and the export's own JSDoc
 *   type spec    the role's resolved values, from `typography.ts`
 *   examples     the component's preview, `.design-sync/previews/<Name>.tsx`,
 *                one example per named export, verbatim
 *   source       a screen's whole file: a screen is used whole, so a design
 *                that changes one copies its composition instead
 *   group        where the source lives
 *
 * Props are appended by the converter from the declarations.
 */

import { existsSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { join } from 'node:path';

const GROUPS = [
  { category: 'App', dir: 'src/components' },
  { category: 'Primitives', dir: 'src/design/primitives' },
];

/** A block comment's text, without the delimiters and the leading stars. */
function commentText(block) {
  return block
    .replace(/^\/\*\*?/, '')
    .replace(/\*\/$/, '')
    .split('\n')
    .map((line) => line.replace(/^\s*\* ?/, ''))
    .join('\n')
    .trim();
}

/** The comment that opens a file, if it comes before the first import. */
function fileHeader(source) {
  const match = /^\s*(\/\*\*[\s\S]*?\*\/)/.exec(source);
  return match ? commentText(match[1]) : '';
}

/** The JSDoc directly above `export function|const <name>`. */
function exportDoc(source, name) {
  const match = new RegExp(
    `(\\/\\*\\*(?:(?!\\*\\/)[\\s\\S])*\\*\\/)\\s*export\\s+(?:function|const)\\s+${name}\\b`,
  ).exec(source);
  return match ? commentText(match[1]) : '';
}

/** Named exports of a preview: `export const Name = () => <jsx>;`. */
function previewExamples(path) {
  if (!existsSync(path)) return [];
  const source = readFileSync(path, 'utf8');
  const parts = source.split(/^export const /m).slice(1);
  return parts.map((part) => {
    const name = /^(\w+)/.exec(part)[1];
    const body = part
      .replace(/^\w+\s*=\s*\(\)\s*=>\s*/, '')
      .trim()
      .replace(/;$/, '')
      .replace(/^\(\n([\s\S]*)\n\)$/, (_, inner) => inner.replace(/^  /gm, ''));
    return { name, body };
  });
}

function typeSpecLine(spec, resolved) {
  const face = resolved.fontFamily.replace(/_\d+/, ' ');
  const parts = [
    `${face} (${spec.weight}), ${resolved.fontSize}px on a ${resolved.lineHeight}px line`,
    resolved.letterSpacing ? `tracking ${resolved.letterSpacing.toFixed(2)}px` : 'no tracking',
  ];
  if (spec.uppercase) parts.push('uppercase');
  if (spec.extent === 'digits') parts.push('numerals only');
  parts.push(
    spec.maxScale ? `scales with text size up to ${spec.maxScale}×` : 'scales with text size',
  );
  return `**Type:** ${parts.join('; ')}.`;
}

export async function writeDocs({ root, out, build }) {
  rmSync(out, { recursive: true, force: true });
  mkdirSync(out, { recursive: true });
  const previews = join(root, '.design-sync/previews');

  const docs = new Map();
  const add = (name, category, description, source) =>
    docs.set(name, { category, description, source });

  for (const { category, dir } of GROUPS) {
    const index = readFileSync(join(root, dir, 'index.ts'), 'utf8');
    const files = [...index.matchAll(/from '\.\/(\w+)'/g)].map((m) => m[1]);
    if (category === 'App') files.push('VolumeNudge');
    for (const file of files) {
      const path = join(root, dir, `${file}.tsx`);
      if (!existsSync(path)) continue;
      const source = readFileSync(path, 'utf8');
      for (const m of source.matchAll(/^export function ([A-Z]\w*)/gm)) {
        const name = m[1];
        const own = exportDoc(source, name);
        const header = name === file ? fileHeader(source) : '';
        add(name, category, [header, own].filter(Boolean).join('\n\n'));
      }
    }
  }

  // Type roles, with the values each resolves to.
  const bundled = await build({
    entryPoints: [join(root, 'src/design/typography.ts')],
    bundle: true,
    platform: 'node',
    format: 'cjs',
    write: false,
    logLevel: 'warning',
  });
  const mod = { exports: {} };
  new Function('module', 'exports', 'require', bundled.outputFiles[0].text)(
    mod,
    mod.exports,
    createRequire(import.meta.url),
  );
  const { typeScale, typeSpecs } = mod.exports;
  const text = readFileSync(join(root, 'src/design/text.tsx'), 'utf8');
  for (const m of text.matchAll(/export const (\w+) = variantComponent\('(\w+)'/g)) {
    const [, name, role] = m;
    const own = exportDoc(text, name);
    const roleDoc = (() => {
      const typography = readFileSync(join(root, 'src/design/typography.ts'), 'utf8');
      const match = new RegExp(`(\\/\\*\\*(?:(?!\\*\\/)[\\s\\S])*\\*\\/)\\s*${role}:\\s*\\{`).exec(
        typography,
      );
      return match ? commentText(match[1]) : '';
    })();
    add(
      name,
      'Type',
      [typeSpecLine(typeSpecs[role], typeScale[role]), own, roleDoc].filter(Boolean).join('\n\n'),
    );
  }
  add(
    'AppText',
    'Type',
    [fileHeader(text), exportDoc(text, 'AppText')].filter(Boolean).join('\n\n'),
  );

  for (const file of readdirSync(join(root, 'src/screens'))) {
    if (!/^\w+\.tsx$/.test(file)) continue;
    const rel = `src/screens/${file}`;
    const source = readFileSync(join(root, rel), 'utf8');
    const name = /^export function ([A-Z]\w*)/m.exec(source)?.[1];
    if (!name) continue;
    add(
      name,
      'Screens',
      [fileHeader(source), exportDoc(source, name)].filter(Boolean).join('\n\n'),
      {
        rel,
        text: source.trim(),
      },
    );
  }

  const provider = readFileSync(join(root, '.design-sync/web/LymphaProvider.tsx'), 'utf8');
  add('LymphaProvider', 'Setup', exportDoc(provider, 'LymphaProvider'));

  for (const [name, { category, description, source }] of docs) {
    const examples = previewExamples(join(previews, `${name}.tsx`));
    const body = [
      `---\ncategory: ${category}\n---\n`,
      description,
      examples.length
        ? '## Examples\n\n' +
          examples.map((e) => `### ${e.name}\n\n\`\`\`jsx\n${e.body}\n\`\`\``).join('\n\n')
        : '',
      source
        ? `## Source\n\nThe app's \`${source.rel}\`. To change the screen, copy this ` +
          'composition into the design and edit it there, reading from `window.Lympha` ' +
          'instead of the `@/` imports. Its state hooks read the enclosing ' +
          "`LymphaProvider`'s `state`.\n\n```tsx\n" +
          source.text +
          '\n```'
        : '',
    ]
      .filter(Boolean)
      .join('\n\n');
    writeFileSync(join(out, `${name}.md`), body + '\n');
  }
  return docs.size;
}
