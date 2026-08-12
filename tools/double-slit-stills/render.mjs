// Renders the three static double-slit figures in §IV of the quantum post *out of the
// interactive widget itself*, so the stills and the thing the reader drives two paragraphs
// later cannot drift apart. Run `npm run build` first — this reads the widget's markup out
// of _site, and its CSS out of src/assets/css.
//
//   node tools/double-slit-stills/render.mjs
//
// Needs Brave (or any Chromium) for the headless render, and ImageMagick for the crop.

import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const CHROMIUM = process.env.CHROMIUM
    ?? '/Applications/Brave Browser.app/Contents/MacOS/Brave Browser';

const PAGE = '_site/posts/how-does-quantum-mechanics-work/index.html';
const OUT = 'src/assets/img/qm';

// Slider positions, in the widget's own 0–1000. Solved rather than eyeballed, against the
// shipped defaults (wavelength 12, separation 22). See computeDoubleSlitPaths() in quantum.js
// for the geometry; the drawing is DSP_WIDTH = 200 units wide with the slits at 100 ∓ 11.
//
//   500  detector on the centre line — the paths are the same length, so the arrows align.
//   555  detector directly above the right slit (111 / 200). The right path is then exactly
//        vertical, which is the *shortest* it can be, and the left path is at its longest so
//        far — which is the pair of claims the prose beside this figure makes. Note this is
//        deliberately no longer the λ/4 spot the other two are solved against: the path
//        difference here is 1.74 of a 12-unit wavelength, so the arrows sit ~52° apart
//        rather than a quarter turn. The picture illustrating "slightly out of sync" now
//        matches the sentence rather than the arithmetic of the figure after it.
//   696  path difference of exactly λ/2 — the arrows are opposed and the total is zero.
const STILLS = [
    { position: 500, name: 'double-slit-paths-aligned' },
    { position: 555, name: 'double-slit-paths-partial' },
    { position: 696, name: 'double-slit-paths-cancelled' },
];

function extractWidget(html) {
    const start = html.indexOf('<div id="double-slit-paths"');
    if (start < 0) throw new Error(`no double-slit-paths widget in ${PAGE} — run npm run build`);

    let depth = 0;
    for (const m of html.slice(start).matchAll(/<div\b|<\/div>/g)) {
        depth += m[0] === '</div>' ? -1 : 1;
        if (depth === 0) return html.slice(start, start + m.index + m[0].length);
    }
    throw new Error('unbalanced markup around the widget');
}

const repo = process.cwd();
const widget = extractWidget(readFileSync(join(repo, PAGE), 'utf8'));
const css = readFileSync(join(repo, OUT, '../../css/quantum.css'), 'utf8');

const harness = `<!doctype html><html><head><meta charset="utf-8"><style>
@font-face {
  font-family: 'PP Supply Mono';
  src: url('file://${repo}/src/assets/fonts/PPSupplyMono-Regular.otf') format('opentype');
  font-weight: 400; font-style: normal; font-display: block;
}
${css}
html, body { margin: 0; padding: 0; background: #fff; }
#stage { width: 700px; }
/* The stills are the widget minus the three controls and the probability chart — at this
   point in the article the prose has introduced neither. */
.dsp-control, .dsp-controls, .dsp-chart { display: none !important; }
/* And with the controls gone, the equation would hang off the top of a much taller setup
   column. This is the only difference between these stills and the live widget. */
.dsp-body { align-items: center !important; }
/* Square corners. The card's own 40px radius would be baked into the PNG, and .post__figure
   img then rounds the image again at 20px — two different radii a few pixels apart, which
   reads as a rendering fault rather than as a design. Let the stylesheet do the rounding:
   the still is a plain rectangle and the article clips it. */
#stage .widget { border-radius: 0 !important; }
</style></head><body>
<div id="stage">${widget}</div>
<script>
  /* Headless Chromium never runs a real animation frame, and the widget coalesces its
     renders into one — so run them as ordinary tasks instead. */
  window.requestAnimationFrame = fn => setTimeout(() => fn(performance.now()), 0);
  window.cancelAnimationFrame = id => clearTimeout(id);
</script>
<script src="file://${repo}/src/assets/js/quantum.js"></script>
<script>
  /* On load, never a timer: under --virtual-time-budget a timer task can be run before
     parsing finishes, which would put this ahead of the widget's own DOMContentLoaded init
     and leave every reading at the untouched markup. */
  window.addEventListener('load', () => {
    const position = new URL(location.href).searchParams.get('position');
    const $slider = document.getElementById('dsp-position');
    $slider.value = position;
    $slider.dispatchEvent(new Event('input', { bubbles: true }));
  });
</script></body></html>`;

const work = mkdtempSync(join(tmpdir(), 'dsp-stills-'));
const harnessPath = join(work, 'harness.html');
writeFileSync(harnessPath, harness);

for (const { position, name } of STILLS) {
    const raw = join(work, `${name}.png`);

    execFileSync(CHROMIUM, [
        '--headless', '--disable-gpu', '--hide-scrollbars', '--allow-file-access-from-files',
        '--virtual-time-budget=4000',
        '--force-device-scale-factor=2',   // the @2x the article ships
        '--window-size=700,300',
        `--screenshot=${raw}`,
        `file://${harnessPath}?position=${position}`,
    ], { stdio: 'ignore' });

    // The page is white and the card is #F5F5F5, so a trim crops to the card exactly. The
    // 1px border gives -trim a corner to sample.
    execFileSync('magick', [
        raw, '-bordercolor', 'white', '-border', '1', '-trim', '+repage',
        join(repo, OUT, `${name}.png`),
    ]);

    console.log(`${name}.png  (position ${position})`);
}
