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
// Take the post list from src, not from _site/posts — that directory is whatever the last
// build left behind plus whatever Finder dropped in it, and a stray .DS_Store read as a slug
// fails the run with "not built". From src, "not built" means what it says.
const slugs = process.argv.slice(2).length
    ? process.argv.slice(2)
    : readdirSync('src/posts').filter(f => f.endsWith('.md')).map(f => f.replace(/\.md$/, ''));

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

    // Definitions are matched inside the SOURCE, never against the output's ids: notes are
    // numbered by order of first reference, so deleting one shifts every number below it
    // and a label-vs-number diff would report the last note as missing.
    //
    // A marker now resolves anywhere in the built page — captions, raw HTML tables, widget
    // markup — so "referenced" no longer depends on where in the Markdown it sat. What can
    // still go wrong is a typo'd label: the definition is then dropped from the page and the
    // marker ships as literal text, neither of which announces itself.
    if (md) {
        const defined = new Set([...md.matchAll(/^\[\^([^\]\s]+)\]:/gm)].map(m => m[1]));
        const body = md.replace(/^\[\^[^\]\s]+\]:.*$/gm, '');
        const referenced = new Set([...body.matchAll(/\[\^([^\]\s]+)\]/g)].map(m => m[1]));
        const orphaned = [...defined].filter(n => !referenced.has(n));
        const dangling = [...referenced].filter(n => !defined.has(n));
        orphaned.length && fail(`defined but never referenced (dropped from the page): ${orphaned.map(n => `[^${n}]`).join(', ')}`);
        dangling.length && fail(`referenced but never defined (renders literally): ${dangling.map(n => `[^${n}]`).join(', ')}`);

        // Every note the source defines has to reach the page as a reference, a margin
        // sidenote AND a bottom-of-page list item — the three are what the reader sees at
        // one width or another, and a note missing from just one of them is invisible in
        // review.
        const expected = defined.size - orphaned.length;
        const refLabels = new Set([...html.matchAll(/class="fn-ref" id="[^"]*" data-fn="([^"]+)"/g)].map(m => m[1]));
        const noteLabels = [...html.matchAll(/class="sidenote" id="[^"]*" data-fn="([^"]+)"/g)].map(m => m[1]);
        const itemCount = (html.match(/class="footnote-item"/g) || []).length;
        if (refLabels.size !== expected || noteLabels.length !== expected || itemCount !== expected) {
            fail(`${expected} notes expected, but the page has ${refLabels.size} referenced, ` +
                 `${noteLabels.length} sidenotes and ${itemCount} list items`);
        } else if (!orphaned.length && !dangling.length) {
            pass(`all ${expected} notes referenced, in the margin and in the list`);
        }

        // The hidden definition block is scaffolding; it must not survive the transform.
        html.includes('class="fn-defs"') && fail('fn-defs block left in the page');
    }

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
