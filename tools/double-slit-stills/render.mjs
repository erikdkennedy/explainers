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

// Slider positions, in the widget's own 0–1000. Solved rather than eyeballed: with the
// shipped defaults (wavelength 12, separation 22) the two path lengths differ by 0, λ/4 and
// λ/2 at these three spots — so the arrows land aligned, a quarter turn apart, and exactly
// opposed. See computeDoubleSlitPaths() in quantum.js for the geometry.
const STILLS = [
    { position: 500, name: 'double-slit-paths-aligned' },
    { position: 595, name: 'double-slit-paths-partial' },
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
