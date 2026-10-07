/**
 * Derives a font's vertical metrics from the shipped TTFs.
 *
 * React Native clips glyphs to the lineHeight box, taking the shortfall off the
 * top, so each font has a hard line-height floor below which capitals and digits
 * shear. This computes it.
 *
 * Run: node scripts/font-metrics.mjs [family] [...weights]
 *   node scripts/font-metrics.mjs                     → Nunito, every loaded weight
 *   node scripts/font-metrics.mjs figtree 600SemiBold  → one face of another family
 *
 * Every family in the app needs its own numbers: two fonts at the same nominal
 * size have different ascenders, descenders and cap heights, so a line height that
 * is safe in one shears glyphs in the other. The output is transcribed into
 * src/design/metrics.ts.
 */
import fs from 'node:fs';

const FAMILIES = {
  nunito: {
    name: 'Nunito',
    weights: ['400Regular', '600SemiBold', '700Bold', '800ExtraBold', '900Black'],
  },
  // Only the weight the app ships. Any other face in the package can still be
  // measured by naming it: `node scripts/font-metrics.mjs figtree 700Bold`.
  figtree: { name: 'Figtree', weights: ['600SemiBold'] },
};

const [familyArg, ...weightArgs] = process.argv.slice(2);
const family = FAMILIES[(familyArg ?? 'nunito').toLowerCase()];
if (!family) {
  console.error(`Unknown family. Known: ${Object.keys(FAMILIES).join(', ')}`);
  process.exit(1);
}
const WEIGHTS = weightArgs.length > 0 ? weightArgs : family.weights;
const PACKAGE = family.name.toLowerCase();

function readTables(b) {
  const n = b.readUInt16BE(4);
  const t = {};
  for (let i = 0; i < n; i++) {
    const o = 12 + i * 16;
    t[b.toString('ascii', o, o + 4)] = { off: b.readUInt32BE(o + 8), len: b.readUInt32BE(o + 12) };
  }
  return t;
}

/** The PostScript name (name ID 6), from the Windows Unicode record, which is UTF-16BE. */
function postScriptName(b, t) {
  const base = t.name.off;
  const count = b.readUInt16BE(base + 2);
  const strings = base + b.readUInt16BE(base + 4);
  for (let i = 0; i < count; i++) {
    const r = base + 6 + i * 12;
    if (b.readUInt16BE(r) !== 3 || b.readUInt16BE(r + 6) !== 6) continue;
    const start = strings + b.readUInt16BE(r + 10);
    return b.subarray(start, start + b.readUInt16BE(r + 8)).swap16().toString('utf16le');
  }
  return null;
}

function cmapLookup(b, t) {
  const cm = t.cmap.off;
  const n = b.readUInt16BE(cm + 2);
  let sub = null;
  for (let i = 0; i < n; i++) {
    const o = cm + 4 + i * 8;
    const pid = b.readUInt16BE(o);
    const eid = b.readUInt16BE(o + 2);
    const off = cm + b.readUInt32BE(o + 4);
    if (b.readUInt16BE(off) === 4 && pid === 3 && (eid === 1 || eid === 0)) sub = off;
  }
  const segX2 = b.readUInt16BE(sub + 6);
  const seg = segX2 / 2;
  const endO = sub + 14;
  const startO = endO + segX2 + 2;
  const deltaO = startO + segX2;
  const rangeO = deltaO + segX2;
  return (code) => {
    for (let s = 0; s < seg; s++) {
      if (code > b.readUInt16BE(endO + s * 2)) continue;
      const start = b.readUInt16BE(startO + s * 2);
      if (code < start) return 0;
      const delta = b.readInt16BE(deltaO + s * 2);
      const ro = b.readUInt16BE(rangeO + s * 2);
      if (ro === 0) return (code + delta) & 0xffff;
      const gi = b.readUInt16BE(rangeO + s * 2 + ro + (code - start) * 2);
      return gi === 0 ? 0 : (gi + delta) & 0xffff;
    }
    return 0;
  };
}

/** yMax / yMin straight from the glyph outline bounding box. */
function glyphBounds(b, t, gid, indexToLocFormat, numGlyphs) {
  if (gid >= numGlyphs) return null;
  const loca = t.loca.off;
  const [start, end] =
    indexToLocFormat === 0
      ? [b.readUInt16BE(loca + gid * 2) * 2, b.readUInt16BE(loca + gid * 2 + 2) * 2]
      : [b.readUInt32BE(loca + gid * 4), b.readUInt32BE(loca + gid * 4 + 4)];
  if (start === end) return null; // empty glyph, e.g. space
  const g = t.glyf.off + start;
  return { yMin: b.readInt16BE(g + 4), yMax: b.readInt16BE(g + 8) };
}

const rows = [];
for (const w of WEIGHTS) {
  const b = fs.readFileSync(
    `node_modules/@expo-google-fonts/${PACKAGE}/${w}/${family.name}_${w}.ttf`,
  );
  const t = readTables(b);
  const upm = b.readUInt16BE(t.head.off + 18);
  const indexToLocFormat = b.readInt16BE(t.head.off + 50);
  const numGlyphs = b.readUInt16BE(t.maxp.off + 4);
  const ascender = b.readInt16BE(t.hhea.off + 4);
  const descender = b.readInt16BE(t.hhea.off + 6);
  const lineGap = b.readInt16BE(t.hhea.off + 8);
  // OS/2 publishes cap and x-height directly, and they are not derivable from the
  // outlines: 'H' happens to equal the cap height in most fonts but is not defined
  // to. Present from OS/2 version 2 on.
  const os2Version = b.readUInt16BE(t['OS/2'].off);
  const xHeight = os2Version >= 2 ? b.readInt16BE(t['OS/2'].off + 86) : null;
  const capHeight = os2Version >= 2 ? b.readInt16BE(t['OS/2'].off + 88) : null;
  const lookup = cmapLookup(b, t);

  // Widest ink extents over the characters this app actually renders large:
  // digits, capitals, and the lower-case set (for descenders).
  const chars = [];
  for (let c = 0x30; c <= 0x39; c++) chars.push(c); // 0-9
  for (let c = 0x41; c <= 0x5a; c++) chars.push(c); // A-Z
  for (let c = 0x61; c <= 0x7a; c++) chars.push(c); // a-z

  let inkTop = -Infinity;
  let inkBottom = Infinity;
  let digitTop = -Infinity;
  for (const c of chars) {
    const bounds = glyphBounds(b, t, lookup(c), indexToLocFormat, numGlyphs);
    if (!bounds) continue;
    inkTop = Math.max(inkTop, bounds.yMax);
    inkBottom = Math.min(inkBottom, bounds.yMin);
    if (c >= 0x30 && c <= 0x39) digitTop = Math.max(digitTop, bounds.yMax);
  }

  const contentBox = ascender - descender + lineGap;
  // RN takes the lineHeight shortfall off the TOP, so the ascent actually
  // available is: ascender - (contentBox - lineHeight). Requiring that to cover
  // the tallest ink gives the floor below which glyphs shear.
  const floorDigits = (contentBox - ascender + digitTop) / upm;
  const floorAll = (contentBox - ascender + inkTop) / upm;

  rows.push({
    w,
    postScriptName: postScriptName(b, t),
    upm,
    ascender,
    descender,
    lineGap,
    xHeight,
    capHeight,
    contentBox,
    inkTop,
    inkBottom,
    digitTop,
    floorDigits,
    floorAll,
  });
}

const f = (n) => n.toFixed(4);
console.log(`\n${family.name}`);
console.log(
  'weight        upm  asc  desc  contentBox  inkTop  inkBottom  digitTop  floor(digits)  floor(all)',
);
for (const r of rows) {
  console.log(
    `${r.w.padEnd(13)} ${r.upm}  ${r.ascender}  ${r.descender}   ${r.contentBox}       ` +
      `${r.inkTop}     ${r.inkBottom}      ${r.digitTop}       ${f(r.floorDigits)}         ${f(r.floorAll)}`,
  );
}
console.log('\nem, for transcription into metrics.ts:');
for (const r of rows) {
  console.log(
    `${r.w.padEnd(13)} ascent ${(r.ascender / r.upm).toFixed(3)}  descent ${(-r.descender / r.upm).toFixed(3)}  ` +
      `contentBox ${(r.contentBox / r.upm).toFixed(3)}  cap ${r.capHeight === null ? '   ?  ' : (r.capHeight / r.upm).toFixed(3)}  ` +
      `x ${r.xHeight === null ? '  ?  ' : (r.xHeight / r.upm).toFixed(3)}  ` +
      `inkTop ${(r.inkTop / r.upm).toFixed(3)}  digitTop ${(r.digitTop / r.upm).toFixed(3)}  ` +
      `inkBottom ${(r.inkBottom / r.upm).toFixed(3)}  postScriptName ${r.postScriptName}`,
  );
}

const worst = Math.max(...rows.map((r) => r.floorAll));
console.log(`\nWorst-case lineHeight floor across weights: ${f(worst)} em`);
console.log(
  `Recommended minimum ratio (with headroom): ${(Math.ceil(worst * 100) / 100 + 0.02).toFixed(2)}`,
);
