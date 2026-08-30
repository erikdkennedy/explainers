#!/usr/bin/env node
/*
 * Writes a .webp next to every raster in src/assets/img.
 *
 *     node tools/webp/convert.mjs [--force]
 *
 * Wired into `eleventy.before` (see .eleventy.js), so it runs on both `npm run build` and
 * `npm run serve` and a newly-dropped export is converted without anyone remembering to.
 *
 * The .webp files are build artifacts and are gitignored — the .png/.jpg stays the source of
 * truth, so a re-export is a normal file replace and the conversion follows on the next
 * build. img.md emits a <picture> that offers the .webp and falls back to the original, so
 * nothing here can break an image: if a .webp is missing the <source> simply never matches.
 *
 * ⚠️ Skips anything the conversion does not actually shrink. A few of this site's flat-art
 * PNGs are already smaller than their WebP equivalent — large areas of flat colour are what
 * PNG is *good* at — and shipping the bigger file while claiming an optimisation is worse
 * than doing nothing. Those keep their <source> out of the markup by virtue of having no
 * .webp on disk.
 */

import { readdirSync, statSync, existsSync, unlinkSync } from 'node:fs';
import { join, extname } from 'node:path';
import sharp from 'sharp';

const ROOT = 'src/assets/img';
const QUALITY = 80;          // visually transparent on photographic sources at this size
const FORCE = process.argv.includes('--force');

function* rasters(dir) {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
        const path = join(dir, entry.name);
        if (entry.isDirectory()) yield* rasters(path);
        else if (/\.(png|jpe?g)$/i.test(entry.name)) yield path;
    }
}

export async function convertImages({ quiet = false } = {}) {
    if (!existsSync(ROOT)) return { converted: 0, skipped: 0, kept: 0 };
    let converted = 0, skipped = 0, kept = 0, saved = 0;

    for (const src of rasters(ROOT)) {
        const out = src.replace(/\.(png|jpe?g)$/i, '.webp');
        // Rebuild only when the source is newer, or the .webp isn't there yet.
        if (!FORCE && existsSync(out) && statSync(out).mtimeMs >= statSync(src).mtimeMs) {
            skipped++;
            continue;
        }
        const buffer = await sharp(src).webp({ quality: QUALITY }).toBuffer();
        const before = statSync(src).size;
        if (buffer.length >= before) {
            // Not a win. Make sure a stale one from an earlier run doesn't linger.
            if (existsSync(out)) unlinkSync(out);
            kept++;
            continue;
        }
        await sharp(buffer).toFile(out);
        saved += before - buffer.length;
        converted++;
    }

    if (!quiet && (converted || kept)) {
        console.log(`[webp] ${converted} converted (${(saved / 1e6).toFixed(2)} MB saved), `
            + `${kept} left as-is (webp was larger), ${skipped} up to date`);
    }
    return { converted, skipped, kept, saved };
}

if (import.meta.url === `file://${process.argv[1]}`) {
    convertImages().catch((e) => { console.error(e); process.exit(1); });
}
