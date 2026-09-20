#!/usr/bin/env node
/**
 * OG image generator — rasterises `public/og-image.svg` into the
 * 1200×630 PNG that every OpenGraph / Twitter card consumes.
 *
 *   bun run og:image
 *
 * ── Why a script and not a route ────────────────────────────────────────────
 * The Next.js App Router equivalent is `src/app/opengraph-image.tsx`, which
 * streams a PNG from `ImageResponse` at request time. This project is a
 * Vite + React SPA with no server runtime, so the same 1200×630 canvas is
 * rendered ahead of time by this script and served as a static asset —
 * `src/app/opengraph-image.tsx` keeps the request-time version for the
 * Next.js migration.
 *
 * Fonts are fetched once into `.cache/og-fonts/` (Outfit, OFL) and converted
 * from WOFF to TTF in memory, so the build stays reproducible without
 * committing font binaries to the repository.
 */

import fs from "node:fs";
import path from "node:path";
import zlib from "node:zlib";
import { fileURLToPath } from "node:url";
import { Resvg } from "@resvg/resvg-js";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SVG_PATH = path.join(ROOT, "public", "og-image.svg");
const PNG_PATH = path.join(ROOT, "public", "og-image.png");
const FONT_DIR = path.join(ROOT, ".cache", "og-fonts");

const CANVAS = { width: 1200, height: 630 };

/**
 * Static font instances (Google Fonts, OFL).
 *
 * Outfit is the portal's display face. It has no rupee sign, so Inter is
 * registered as a symbol fallback — the rasteriser resolves `₹` from it
 * per glyph, exactly like a browser would. Both the coverage check and the
 * render probe below fail the build if that ever stops being true.
 */
const FONTS = [
  {
    id: "outfit-400",
    family: "Outfit",
    weight: 400,
    url: "https://fonts.gstatic.com/s/outfit/v15/QGYyz_MVcBeNP4NjuGObqx1XmO1I4TC1O4a0FQ.woff",
  },
  {
    id: "outfit-600",
    family: "Outfit",
    weight: 600,
    url: "https://fonts.gstatic.com/s/outfit/v15/QGYyz_MVcBeNP4NjuGObqx1XmO1I4e6yO4a0FQ.woff",
  },
  {
    id: "outfit-800",
    family: "Outfit",
    weight: 800,
    url: "https://fonts.gstatic.com/s/outfit/v15/QGYyz_MVcBeNP4NjuGObqx1XmO1I4bCyO4a0FQ.woff",
  },
  {
    // `&text=₹` asks Google for a one-glyph subset: no Google Fonts subset
    // ships U+20B9, so the whole fallback is that single character.
    id: "inter-rupee-800",
    family: "Inter",
    weight: 800,
    url: "https://fonts.gstatic.com/l/font?kit=UcCO3FwrK3iLTeHuS_nVMrMxCp50SjIw2boKoduKmMEVuDyYMZtzjlcCIg&skey=c491285d6722e4fa&v=v20",
  },
];

// ── Fonts ────────────────────────────────────────────────────────────────────

/** Converts a WOFF (zlib-compressed sfnt) buffer into a plain TTF buffer. */
function woffToTtf(woff) {
  if (woff.readUInt32BE(0) !== 0x774f4646) {
    throw new Error("font is not a WOFF container");
  }
  const flavor = woff.readUInt32BE(4);
  const numTables = woff.readUInt16BE(12);

  const tables = [];
  for (let i = 0; i < numTables; i++) {
    const p = 44 + i * 20;
    tables.push({
      tag: woff.toString("ascii", p, p + 4),
      offset: woff.readUInt32BE(p + 4),
      compLength: woff.readUInt32BE(p + 8),
      origLength: woff.readUInt32BE(p + 12),
      checksum: woff.readUInt32BE(p + 16),
    });
  }
  tables.sort((a, b) => (a.tag < b.tag ? -1 : a.tag > b.tag ? 1 : 0));

  const selector = Math.floor(Math.log2(numTables));
  const searchRange = 16 * 2 ** selector;
  const rangeShift = numTables * 16 - searchRange;

  let cursor = 12 + numTables * 16;
  const payloads = [];
  for (const table of tables) {
    const compressed = woff.subarray(table.offset, table.offset + table.compLength);
    const data =
      table.compLength < table.origLength
        ? zlib.inflateSync(compressed)
        : Buffer.from(compressed);
    if (data.length !== table.origLength) {
      throw new Error(`table ${table.tag} decompressed to an unexpected length`);
    }
    const pad = (4 - (data.length % 4)) % 4;
    table.outOffset = cursor;
    cursor += data.length + pad;
    payloads.push(data);
  }

  const ttf = Buffer.alloc(cursor);
  ttf.writeUInt32BE(flavor, 0);
  ttf.writeUInt16BE(numTables, 4);
  ttf.writeUInt16BE(searchRange, 6);
  ttf.writeUInt16BE(selector, 8);
  ttf.writeUInt16BE(rangeShift, 10);
  tables.forEach((table, i) => {
    const p = 12 + i * 16;
    ttf.write(table.tag, p, 4, "ascii");
    ttf.writeUInt32BE(table.checksum, p + 4);
    ttf.writeUInt32BE(table.outOffset, p + 8);
    ttf.writeUInt32BE(table.origLength, p + 12);
  });
  payloads.forEach((data, i) => data.copy(ttf, tables[i].outOffset));
  return ttf;
}

/** True when the font's cmap maps `code` to a real glyph. */
function hasGlyph(ttf, code) {
  const numTables = ttf.readUInt16BE(4);
  let cmap = -1;
  for (let i = 0; i < numTables; i++) {
    const p = 12 + i * 16;
    if (ttf.toString("ascii", p, p + 4) === "cmap") cmap = ttf.readUInt32BE(p + 8);
  }
  if (cmap < 0) return false;

  const subtables = ttf.readUInt16BE(cmap + 2);
  for (let i = 0; i < subtables; i++) {
    const sub = cmap + ttf.readUInt32BE(cmap + 4 + i * 8 + 4);
    const format = ttf.readUInt16BE(sub);

    if (format === 4) {
      const segCount = ttf.readUInt16BE(sub + 6) / 2;
      const endBase = sub + 14;
      const startBase = endBase + segCount * 2 + 2;
      const deltaBase = startBase + segCount * 2;
      const rangeBase = deltaBase + segCount * 2;
      for (let s = 0; s < segCount; s++) {
        const end = ttf.readUInt16BE(endBase + s * 2);
        const start = ttf.readUInt16BE(startBase + s * 2);
        if (code < start || code > end) continue;
        const delta = ttf.readInt16BE(deltaBase + s * 2);
        const rangeOffset = ttf.readUInt16BE(rangeBase + s * 2);
        if (rangeOffset === 0) return ((code + delta) & 0xffff) !== 0;
        const gid = ttf.readUInt16BE(
          rangeBase + s * 2 + rangeOffset + (code - start) * 2,
        );
        return gid !== 0 && ((gid + delta) & 0xffff) !== 0;
      }
    } else if (format === 12) {
      const groups = ttf.readUInt32BE(sub + 12);
      for (let g = 0; g < groups; g++) {
        const p = sub + 16 + g * 12;
        const start = ttf.readUInt32BE(p);
        const end = ttf.readUInt32BE(p + 4);
        if (code >= start && code <= end) return ttf.readUInt32BE(p + 8) !== 0;
      }
    }
  }
  return false;
}

/** Downloads the static Outfit weights once, returning TTF buffers. */
async function loadFonts() {
  fs.mkdirSync(FONT_DIR, { recursive: true });
  const loaded = [];
  for (const font of FONTS) {
    const ttfPath = path.join(FONT_DIR, `${font.id}.ttf`);
    if (!fs.existsSync(ttfPath)) {
      process.stdout.write(`  fetching ${font.family} ${font.weight} … `);
      const res = await fetch(font.url);
      if (!res.ok) throw new Error(`font download failed (${res.status})`);
      fs.writeFileSync(ttfPath, woffToTtf(Buffer.from(await res.arrayBuffer())));
      console.log("ok");
    }
    loaded.push({
      family: font.family,
      weight: font.weight,
      path: ttfPath,
      data: fs.readFileSync(ttfPath),
    });
  }
  return loaded;
}

// ── PNG verification (zero-dependency decode) ────────────────────────────────

/** Decodes a non-interlaced 8-bit PNG into raw RGBA/colour-channel bytes. */
function decodePng(buf) {
  if (buf.readUInt32BE(0) !== 0x89504e47) throw new Error("not a PNG");
  let pos = 8;
  let width = 0;
  let height = 0;
  let colorType = 0;
  const idat = [];
  while (pos < buf.length) {
    const length = buf.readUInt32BE(pos);
    const type = buf.toString("ascii", pos + 4, pos + 8);
    const data = buf.subarray(pos + 8, pos + 8 + length);
    if (type === "IHDR") {
      width = data.readUInt32BE(0);
      height = data.readUInt32BE(4);
      colorType = data[9];
    } else if (type === "IDAT") {
      idat.push(data);
    }
    pos += 12 + length;
  }
  const channels = { 0: 1, 2: 3, 4: 2, 6: 4 }[colorType];
  const raw = zlib.inflateSync(Buffer.concat(idat));
  const stride = width * channels;
  const out = Buffer.alloc(height * stride);
  let prev = Buffer.alloc(stride);
  for (let y = 0; y < height; y++) {
    const filter = raw[y * (stride + 1)];
    const cur = Buffer.from(raw.subarray(y * (stride + 1) + 1, (y + 1) * (stride + 1)));
    for (let x = 0; x < stride; x++) {
      const a = x >= channels ? cur[x - channels] : 0;
      const b = prev[x];
      const c = x >= channels ? prev[x - channels] : 0;
      if (filter === 1) cur[x] = (cur[x] + a) & 255;
      else if (filter === 2) cur[x] = (cur[x] + b) & 255;
      else if (filter === 3) cur[x] = (cur[x] + ((a + b) >> 1)) & 255;
      else if (filter === 4) {
        const p = a + b - c;
        const pa = Math.abs(p - a);
        const pb = Math.abs(p - b);
        const pc = Math.abs(p - c);
        cur[x] = (cur[x] + (pa <= pb && pa <= pc ? a : pb <= pc ? b : c)) & 255;
      }
    }
    cur.copy(out, y * stride);
    prev = cur;
  }
  return { width, height, channels, data: out };
}

/**
 * Composition assertions — catches silent layout drift (a tile that moved,
 * a headline that failed to render, a KPI that lost its gold).
 * Boxes are [x, y, width, height] in canvas coordinates.
 */
const REGIONS = [
  {
    label: "obsidian backdrop",
    box: [1150, 590, 50, 40],
    match: (r, g, b) => r < 40 && g < 40 && b < 60,
    min: 1800,
  },
  {
    label: "purple gradient headline",
    box: [80, 180, 920, 160],
    match: (r, g, b) => b > 140 && b > g + 25 && r > 80,
    min: 1200,
  },
  {
    label: "gold “85%” callout",
    box: [80, 414, 320, 92],
    match: (r, g, b) => r > 170 && g > 110 && b < 110,
    min: 300,
  },
  {
    label: "gold “₹44 LPA” callout",
    box: [440, 414, 320, 92],
    match: (r, g, b) => r > 170 && g > 110 && b < 110,
    min: 300,
  },
  {
    label: "purple “412” callout",
    box: [800, 414, 320, 92],
    match: (r, g, b) => b > 140 && b > g + 25 && r > 90,
    min: 300,
  },
  {
    label: "footer wordmark",
    box: [80, 560, 420, 55],
    match: (r, g, b) => r + g + b > 240,
    min: 40,
  },
];

/** Runs the region assertions, returning the failure messages. */
function checkComposition(image) {
  const failures = [];
  for (const region of REGIONS) {
    const [x, y, w, h] = region.box;
    let hits = 0;
    for (let py = y; py < y + h; py++) {
      for (let px = x; px < x + w; px++) {
        const i = (py * image.width + px) * image.channels;
        if (region.match(image.data[i], image.data[i + 1], image.data[i + 2])) hits++;
      }
    }
    if (hits < region.min) {
      failures.push(`${region.label}: ${hits} matching px (expected ≥ ${region.min})`);
    }
  }
  return failures;
}

/**
 * Coarse ASCII preview of a decoded PNG — lets the layout be reviewed from a
 * terminal (and in CI logs) without opening the file. Enable with --preview.
 */
function asciiPreview(image, columns = 96) {
  const cellW = image.width / columns;
  const rows = Math.max(1, Math.round((columns * image.height) / image.width / 2));
  const cellH = image.height / rows;
  const lines = [];

  for (let row = 0; row < rows; row++) {
    let line = "";
    for (let col = 0; col < columns; col++) {
      let r = 0;
      let g = 0;
      let b = 0;
      let samples = 0;
      for (let y = row * cellH; y < (row + 1) * cellH; y++) {
        for (let x = col * cellW; x < (col + 1) * cellW; x++) {
          const i = (Math.floor(y) * image.width + Math.floor(x)) * image.channels;
          r += image.data[i];
          g += image.data[i + 1];
          b += image.data[i + 2];
          samples++;
        }
      }
      r /= samples;
      g /= samples;
      b /= samples;
      const lum = 0.2126 * r + 0.7152 * g + 0.0722 * b;
      if (r > 150 && g > 110 && b < 90) line += "Y";
      else if (b > 110 && b > g + 25) line += "P";
      else if (lum > 170) line += "#";
      else if (lum > 60) line += "+";
      else if (lum > 18) line += ".";
      else line += " ";
    }
    lines.push(line.replace(/\s+$/, ""));
  }
  return lines.join("\n");
}

// ── Main ─────────────────────────────────────────────────────────────────────

const svg = fs.readFileSync(SVG_PATH, "utf8");
console.log("NexusPlacement OG image");
console.log("  source:", path.relative(ROOT, SVG_PATH));

const fonts = await loadFonts();
const fontFiles = fonts.map((font) => font.path);
const families = [...new Set(fonts.map((font) => font.family))];
console.log(`  fonts: ${families.join(" + ")} (${fonts.length} weights, woff → ttf)`);

/** Renders an SVG string at the given width with the loaded font set. */
function renderPng(source, width) {
  return new Resvg(source, {
    fitTo: { mode: "width", value: width },
    font: { fontFiles, loadSystemFonts: false, defaultFontFamily: "Outfit" },
  })
    .render()
    .asPng();
}

/** Inked pixels in a transparent-canvas probe — 0 means nothing rendered. */
function probeInk(text) {
  const probe =
    '<svg xmlns="http://www.w3.org/2000/svg" width="760" height="170">' +
    '<text x="10" y="126" font-family="Outfit, Inter, sans-serif" ' +
    `font-size="96" font-weight="800" fill="#ffffff">${text}</text></svg>`;
  const decoded = decodePng(renderPng(probe, 760));
  let probePixels = 0;
  for (let i = 0; i < decoded.data.length; i += decoded.channels) {
    if (decoded.data[i] + decoded.data[i + 1] + decoded.data[i + 2] > 90) {
      probePixels++;
    }
  }
  return probePixels;
}

// Every glyph in the artwork must exist in at least one loaded weight, or the
// card would ship a .notdef box (the classic missing "₹" failure).
const glyphs = new Set(
  [...svg.matchAll(/>([^<>]+)<\/text>/g)]
    .flatMap((m) => [...m[1]])
    .filter((ch) => ch.trim().length > 0),
);
const missing = [...glyphs].filter(
  (ch) => !fonts.some((font) => hasGlyph(font.data, ch.codePointAt(0))),
);
if (missing.length) {
  console.error(
    `  ✗ missing glyphs: ${missing.map((c) => `${c} (U+${c.codePointAt(0).toString(16).toUpperCase()})`).join(", ")}`,
  );
  process.exit(1);
}
console.log(`  glyph coverage: ${glyphs.size}/${glyphs.size} characters render`);

// Coverage in the font files is not the same as coverage on the canvas: this
// probe proves the fallback actually resolves the rupee sign per glyph.
const rupeeInk = probeInk("₹44 LPA") - probeInk("44 LPA");
if (rupeeInk <= 100) {
  console.error("  ✗ the ₹ sign did not render — symbol fallback is not resolving");
  process.exit(1);
}
console.log(`  symbol fallback: ₹ renders (+${rupeeInk} inked px over "44 LPA")`);

const png = renderPng(svg, CANVAS.width);

const image = decodePng(png);
let ink = 0;
for (let i = 0; i < image.data.length; i += image.channels) {
  if (image.data[i] + image.data[i + 1] + image.data[i + 2] > 90) ink++;
}
const inkPercent = ((ink / (image.width * image.height)) * 100).toFixed(1);

if (image.width !== CANVAS.width || image.height !== CANVAS.height) {
  console.error(`  ✗ canvas is ${image.width}×${image.height}, expected ${CANVAS.width}×${CANVAS.height}`);
  process.exit(1);
}
console.log(`  canvas: ${image.width}×${image.height} ✓`);

const compositionFailures = checkComposition(image);
if (compositionFailures.length) {
  compositionFailures.forEach((failure) => console.error(`  ✗ ${failure}`));
  process.exit(1);
}
console.log(`  composition: ${REGIONS.length}/${REGIONS.length} expected regions present`);
console.log(`  ink coverage: ${inkPercent}% (non-background pixels present)`);

fs.writeFileSync(PNG_PATH, png);
console.log(`  wrote: ${path.relative(ROOT, PNG_PATH)} (${(png.length / 1024).toFixed(1)} KB)`);

if (process.argv.includes("--preview")) {
  console.log(`\n  preview (P purple · Y gold · # bright text · + mid · . dim):\n`);
  console.log(asciiPreview(image).replace(/^/gm, "  "));
}
