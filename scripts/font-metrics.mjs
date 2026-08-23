/**
 * Derives Nunito's vertical metrics from the shipped TTFs.
 *
 * Why this exists: React Native clips glyphs to the lineHeight box, and the
 * shortfall is taken off the top. So there is a hard floor below which capitals
 * and digits shear. That floor is a property of the font, not a matter of taste,
 * and this script computes it rather than leaving it to be eyeballed.
 *
 * Run: node scripts/font-metrics.mjs
 * The output is transcribed into src/design/metrics.ts.
 */
import fs from 'node:fs';

const WEIGHTS = ['400Regular', '600SemiBold', '700Bold', '800ExtraBold', '900Black'];

function readTables(b) {
  const n = b.readUInt16BE(4);
  const t = {};
  for (let i = 0; i < n; i++) {
    const o = 12 + i * 16;
    t[b.toString('ascii', o, o + 4)] = { off: b.readUInt32BE(o + 8), len: b.readUInt32BE(o + 12) };
  }
  return t;
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
  const b = fs.readFileSync(`node_modules/@expo-google-fonts/nunito/${w}/Nunito_${w}.ttf`);
  const t = readTables(b);
  const upm = b.readUInt16BE(t.head.off + 18);
  const indexToLocFormat = b.readInt16BE(t.head.off + 50);
  const numGlyphs = b.readUInt16BE(t.maxp.off + 4);
  const ascender = b.readInt16BE(t.hhea.off + 4);
  const descender = b.readInt16BE(t.hhea.off + 6);
  const lineGap = b.readInt16BE(t.hhea.off + 8);
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
    upm,
    ascender,
    descender,
    lineGap,
    contentBox,
    inkTop,
    inkBottom,
    digitTop,
    floorDigits,
    floorAll,
  });
}

const f = (n) => n.toFixed(4);
console.log(
  'weight        upm  asc  desc  contentBox  inkTop  inkBottom  digitTop  floor(digits)  floor(all)',
);
for (const r of rows) {
  console.log(
    `${r.w.padEnd(13)} ${r.upm}  ${r.ascender}  ${r.descender}   ${r.contentBox}       ` +
      `${r.inkTop}     ${r.inkBottom}      ${r.digitTop}       ${f(r.floorDigits)}         ${f(r.floorAll)}`,
  );
}
const worst = Math.max(...rows.map((r) => r.floorAll));
console.log(`\nWorst-case lineHeight floor across weights: ${f(worst)} em`);
console.log(
  `Recommended minimum ratio (with headroom): ${(Math.ceil(worst * 100) / 100 + 0.02).toFixed(2)}`,
);
