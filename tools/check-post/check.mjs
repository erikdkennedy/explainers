// Post-transcription sanity checks, run over the BUILT html — most of the failure modes are
// silent in the Markdown. See "Verifying" in CLAUDE.md for why each of these earns its place.
//
//   npm run build && node tools/check-post/check.mjs [slug ...]
//
// Exits non-zero if anything fails, so it can gate a commit.

import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { basename, join } from 'node:path';

const SITE = '_site';
const slugs = process.argv.slice(2).length
    ? process.argv.slice(2)
    : readdirSync(join(SITE, 'posts'));

let failures = 0;
const fail = m => { console.log(`  ✗ ${m}`); failures++; };
const pass = m => console.log(`  ✓ ${m}`);

for (const slug of slugs) {
    const out = join(SITE, 'posts', slug, 'index.html');
    const src = join('src/posts', `${slug}.md`);
    if (!existsSync(out)) { console.log(`\n${slug}\n  ✗ not built`); failures++; continue; }

    const html = readFileSync(out, 'utf8');
    const md = existsSync(src) ? readFileSync(src, 'utf8') : '';
    console.log(`\n${slug}`);

    // Liquid that never ran, and footnote markers that landed somewhere inline parsing
    // doesn't reach. Both ship as literal text.
    const liquid = (html.match(/\{%/g) || []).length;
    liquid ? fail(`${liquid} literal "{%" — an include didn't parse`) : pass('no literal includes');

    // A comment mentioning [^n] is fine; anything in the rendered body is not.
    const body = html.replace(/<!--[\s\S]*?-->/g, '');
    const literalRefs = body.match(/\[\^\d+\]/g) || [];
    literalRefs.length ? fail(`literal footnote markers: ${literalRefs.join(' ')}`) : pass('no literal footnote markers');

    // A marker in a place inline parsing doesn't reach gets no reference, and
    // markdown-it-footnote then drops the definition entirely — no warning, no output.
    //
    // Compare labels within the SOURCE, never against the output's ids: the renderer
    // renumbers by order of first reference, so deleting [^2] silently shifts every id
    // below it and a label-vs-id diff reports the last footnote as missing.
    if (md) {
        const defined = new Set([...md.matchAll(/^\[\^(\d+)\]:/gm)].map(m => m[1]));
        const referenced = new Set([...md.matchAll(/\[\^(\d+)\](?!:)/g)].map(m => m[1]));
        const orphaned = [...defined].filter(n => !referenced.has(n));
        const dangling = [...referenced].filter(n => !defined.has(n));
        orphaned.length && fail(`defined but never referenced (dropped from the page): ${orphaned.map(n => `[^${n}]`).join(', ')}`);
        dangling.length && fail(`referenced but never defined (renders literally): ${dangling.map(n => `[^${n}]`).join(', ')}`);

        // And the page has to actually carry one reference per note.
        const rendered = (html.match(/id="fnref\d+"/g) || []).length;
        if (rendered !== defined.size) fail(`${defined.size} definitions in source but ${rendered} references rendered`);
        else if (!orphaned.length && !dangling.length) pass(`all ${defined.size} footnotes referenced and rendered`);
    }

    // The footnote list and its sidenote clone are two code paths over the same content.
    const lis = [...html.matchAll(/<li id="(fn\d+)"[^>]*>([\s\S]*?)<\/li>/g)];
    const sides = new Map([...html.matchAll(/<div class="sidenote" data-footnote-id="(fn\d+)">([\s\S]*?)<\/div>/g)]
        .map(m => [m[1], m[2]]));
    const countP = s => (s.match(/<p[\s>]/g) || []).length;
    const mismatched = [];
    for (const [, id, liBody] of lis) {
        const side = sides.get(id);
        if (side === undefined) continue;           // note with no inline reference position
        // The clone deliberately splits a *single* paragraph on its newlines, so only a
        // genuinely multi-paragraph note has to match one-for-one.
        if (countP(liBody) > 1 && countP(liBody) !== countP(side)) mismatched.push(id);
    }
    mismatched.length ? fail(`sidenote lost paragraphs: ${mismatched.join(', ')}`)
                      : pass('multi-paragraph footnotes match their sidenotes');

    const empties = (html.match(/<p>\s*<\/p>/g) || []).length;
    if (empties) console.log(`  · ${empties} empty <p> (widget includes emit a couple; a jump here means a transform)`);

    // Figures: the file has to exist, and be dense enough for the width it's shown at.
    const soft = [];
    let missing = 0, imgs = 0;
    for (const m of html.matchAll(/<img src="([^"]+)"(?:[^>]*?width="(\d+)px?")?/g)) {
        const [, src, width] = m;
        imgs++;
        const p = join(SITE, src);
        if (!existsSync(p)) { fail(`missing asset ${src}`); missing++; continue; }
        if (!width) continue;
        const natural = Number(execFileSync('sips', ['-g', 'pixelWidth', p], { encoding: 'utf8' }).trim().split(/\s+/).pop());
        const ratio = natural / Number(width);
        if (ratio < 1.95) soft.push(`${basename(src)} ${natural}/${width} = ${ratio.toFixed(2)}x`);
    }
    if (!missing) pass(`${imgs} images all resolve`);
    if (soft.length) {
        console.log(`  · below @2x (fine for photos, re-export line art):`);
        for (const s of soft) console.log(`      ${s}`);
    }
}

console.log(failures ? `\n${failures} failure(s)` : '\nall checks passed');
process.exit(failures ? 1 : 0);
