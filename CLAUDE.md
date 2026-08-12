# Explainers blog

Eleventy (11ty) + Liquid + Sass static site. Posts are Markdown in `src/posts/`.

## Commands

```bash
npm run serve
```

Runs Eleventy `--serve` (port 8080) and `sass --watch` in parallel, with live reload.
`npm run build` for a one-off build, `npm run clean` to wipe `_site/` and generated CSS,
`npm run check` to build and then run the post sanity checks (see *Verifying*).

A `.claude/launch.json` entry named `explainers-dev` exists so the preview tooling can start
the same thing by name.

## Layout of things

| Path | What |
|---|---|
| `src/posts/*.md` | The posts themselves |
| `src/_includes/img.md` | The figure include — handles `.png` **and** `.mp4` |
| `src/_includes/site-logo.html` | The logo lockup (inline SVG logomark + wordmark), used by the nav and both footers |
| `src/_includes/<slug>-toc.html` | Per-post table of contents |
| `src/_includes/<img_subdir>/` | Per-post interactive widgets & inline SVGs |
| `src/assets/img/<img_subdir>/` | Per-post images/video |
| `src/scss/_posts.scss` | Shared post styles, incl. all table styling |

`src/posts/why-is-the-sky-blue.md` is the reference implementation. **When in doubt about
any formatting question, look there first.**

The logo appears in three places (nav + the footer in each of the two layouts) and they all pull
`site-logo.html`. The logomark is inline SVG using `currentColor`, not an `<img>`, because the
footer renders the logo white on brand blue while the nav renders it in `--brand-color`.

Note: `sass --watch` can go stale and stop emitting to `src/assets/css/` while Eleventy keeps
rebuilding happily — so SCSS edits appear to do nothing. If a style change isn't taking effect,
check the mtime on `src/assets/css/*.css` and restart the dev server before debugging the CSS.
Eleventy's passthrough copy can wedge the same way, leaving `_site/assets/css/` older than
`src/assets/css/` even after sass has re-run; compare both mtimes, not just the one in `src`.

⚠️ **New markup + stale stylesheet does not look like a CSS problem — it looks like a rendering
bug**, and that is what sends you debugging the wrong thing. An inline SVG whose classes have no
rules yet gets **SVG's defaults: `fill: black`, no stroke**. So a chart turns into a solid black
silhouette with the page background showing through where the panel should be. Any "my SVG widget
is drawing a black rectangle" report is this until proven otherwise. One command settles it:

```bash
curl -s http://localhost:8080/assets/css/<name>.css | grep -c "<a-class-you-just-added>"
```

Zero means stale CSS, not a bug. `cp src/assets/css/<name>.css _site/assets/css/` unblocks the
open page immediately; restarting the dev server is the durable fix.

---

# Transcribing a post from Google Docs → Markdown

The workflow: read the doc with the Google Drive MCP tool (`read_file_content`), then hand-port
it. Docs of any real length blow the tool-result token limit and get spilled to a file — probe
it with `python3`/`jq` (`{fileContent: string}`) and slice by line number rather than trying to
read it whole.

## Frontmatter

```yaml
---
title: How does Quantum Mechanics work?
subtitle: An intuitive & non-technical primer      # renders under the title
nutshell: "…"                                      # standfirst above the article body; quote it if it contains a colon
toc: qm-toc.html                                   # include name in src/_includes/
img_subdir: qm                                     # resolves BOTH src/assets/img/<x>/ and src/_includes/<x>/
img_on_homepage: quantum-background-sm.html
video_on_homepage: clouds-slow.mp4                 # optional
header_img: cloud-banner.png                       # optional
header_video: cloud-banner.mp4                     # optional
header_overlay: "#31359D80"                        # optional, 8-digit hex
published_on: 2025-11-01
layout: post
css: quantum                                       # → src/assets/css/<x>.css
js: [post, blue-sky]                               # or a bare string: `js: post`
tags: [posts]
published: false                                   # false = kept out of homepage + RSS, still at its URL
---
```

## Headings

The doc's H1 is the post title — it lives in frontmatter, not the body.

- **H2** → `## Title {data-ordinal="I." #slug}`. Ordinals are Roman numerals counting from the
  first H2 (the introduction is unnumbered and does not get one). Slugs are short and
  hand-written — not derived from the full heading text.
- **H3** → plain `### Title`, no attributes.
- The intro gets a bare `{ #introduction }` marker on its own line before the first paragraph,
  so the TOC's `#introduction` link has a target.

Attribute syntax comes from `markdown-it-attrs`.

## Table of contents

`src/_includes/<slug>-toc.html`, an `<ol>` of **H2s only** (H3s stay out). First item is
Introduction with `class="active"`. The last entry (Further Reading) is conventionally
commented out. Keep hrefs in sync with the heading slugs.

## Images, video, widgets

```liquid
{% include img.md, src: "prism.png", width: "600", alt: "…", caption: "…", image-credit: "…" %}
```

`img.md` switches to a `<video autoplay loop muted playsinline>` when `src` ends in `.mp4`,
so videos use the exact same include. All params optional except `src`. `width` takes either
`"600"` or `"300px"`. Captions accept inline HTML (`<strong>`, `<br>`) — use that instead of
Markdown emphasis, since caption values aren't Markdown-parsed.

Interactive widgets and inline SVGs are separate includes under `src/_includes/<img_subdir>/`:

```liquid
{% include sky/pass-scatter-absorb.html %}
```

```html
<figure class="post__figure inline-svg-diagram">
  {% include sky/why-sky-is-blue-diagram.svg %}
  <figcaption class="post__figure-caption">…</figcaption>
</figure>
```

**Only reference assets that already exist** in `src/assets/img/<img_subdir>/`. Docs are usually
drafted with images that haven't been exported yet; when the doc has a figure with no
corresponding asset, drop an HTML comment carrying the doc's caption so the intent isn't lost:

```html
<!-- TODO: figure – atom emitting phantom-copy photons. Caption: “…” -->
```

## Tables

All tables span the column (`width: 100%`), so a two-column table of short values doesn't sit in a
narrow stripe beside full-width body text. Two other things `_posts.scss` handles for you, so
don't work around them per-post: a table with **no header row** (raw HTML whose first child is
`<tbody>`) gets a top rule, since normally the header row's bottom border is what draws it; and a
`<ul>` inside a cell is pulled back to the cell edge, because the body's reading indent is pure
lost width in a column that has none to spare.

Two options for the table itself, and the choice is driven by cell contents:

- **Pipe tables** for simple one-line cells. Header row required.
- **Raw HTML `<table>`** whenever a cell needs a list, `<br>`, or other block content — pipe
  tables can't hold them. Add `class="dense"` (busts the margin at ≥900px) and/or
  `class="header-column"` (bolds the first column). Wrap in
  `<div class="sticky-column-table-wrapper">` for wide tables that need horizontal scroll on
  mobile.

Google Docs exports multi-line cells as `&#10;`-joined text with `\*\*` escapes — that always
means "rewrite this as an HTML table with a real `<ul>`".

⚠️ **The two options conflict when a cell needs both a list *and* a footnote**, because a footnote
marker inside a raw HTML block renders literally (see below). Pipe table wins: put an inline
`<ul>` in the cell. But then you cannot class the table either — **`markdown-it-attrs` does not
support attributes on a table**; `{.dense}` on the line after one lands on a *row*, and the
kramdown form (`{: class="…"}`) isn't this parser at all and renders as literal text. Put the
classes on a wrapper div and mirror the two declarations in the post's own stylesheet;
`.qm-wide-table` in `quantum.scss` is the worked example, and it says why it exists.

## Footnotes / sidenotes

A custom pair in `.eleventy.js`: a `sidenoteDefinitions` markdown-it plugin that lifts every
`[^label]: …` definition into a hidden block at the end of the document, and a `sidenotes`
transform that resolves the *references* against the built HTML's text nodes. Definitions live
right after the paragraph that references them; 4-space-indented continuation lines for
multi-paragraph notes:

```markdown
And that's the story.[^1]

[^1]: **Well ackshually… 🧐**

    Second paragraph of the sidenote, indented 4 spaces.
```

Because references are resolved in the built HTML rather than during inline Markdown parsing,
**a marker works anywhere text ends up** — a body paragraph, a pipe-table cell, a raw HTML
`<table>` or `<ul>`, an `img.md` caption, a widget include's prose. The one place it does not
is inside an inline `<svg>`'s `<text>`, which would need a `<tspan>`; `svg`, `pre`, `code`,
`script` and `style` are all skipped, so a literal `[^1]` in a code sample stays literal.

Each note is rendered **once** and emitted twice — as a `.sidenote` in the margin and as a
`.footnote-item` in the bottom-of-page list — from the same HTML, so the two cannot disagree.
Exactly one of them is displayed (and therefore in the a11y tree) at any width: the margin
above 1400px, the list below it. Referencing one note from several places is fine; it keeps one
number, and only the later `fnref-` ids get a `-2`, `-3` suffix.

Notes are **positioned by `post.js`**, not by the flow — each sits level with its own marker,
sliding down only as far as the note above it forces. That is why a marker inside a table cell
now gets a note beside that cell rather than below the whole table, and why the
`data-render-sidenote-in-place` attribute the old float layout needed is gone.

The marker is a brand-blue asterisk on a pale brand chip; hovering either end turns the chip
orange and washes a matching gradient down the top of its note. That colour shift is the only
tie between a marker and a note that got pushed down the margin, so it is load-bearing, not
decoration. Below 1400px the marker becomes a numbered chip pointing at the list instead.

⚠️ **The chip is an absolutely-positioned pseudo-element, not padding on the inline box.**
Padding on an inline doesn't grow the line box, but its *background* paints the inline's full
content area — ~24px around a single asterisk in 21px body serif, which draws a tall pill
across the whole line rather than a chip. Out of flow, the box is ours to size and provably
cannot touch line-height (assert it by toggling `display:none` on the pseudo and comparing the
paragraph's height — 121.63px either way).

⚠️ **And its numbers were measured, not eyeballed.** An asterisk's ink is 8.5px tall and sits
*entirely above the baseline* — `actualBoundingBoxDescent` comes back negative — so a guessed
chip is off by about 2x in height and badly placed. Take `actualBoundingBox*` on the glyph
against `fontBoundingBox*` on the link's own font (that pair is what defines the containing
block), and express both in `em` so one set of numbers serves 21px body serif and 16px table
sans alike. The worked arithmetic is in the rule's comment.

⚠️ **The hover wash needs `min(reach, note height)`, and a fixed height is visibly wrong.**
Most notes are shorter than the reach, and a wash that outlives its note hangs in empty margin
below it — it reads as a floating orange card rather than as a highlight *of* anything.

⚠️ **A definition nothing references is still dropped from the page**, and a mistyped label
still ships as literal text. Neither announces itself; `npm run check` compares the source's
labels against the page's references, sidenotes and list items, and it is the only thing that
will tell you.

**Google Docs footnotes do not appear in the `read_file_content` text export.** To get them, call
`download_file_content` with `exportMimeType: "text/markdown"` — that export *does* contain
`[^n]` markers and definitions. It comes back base64-encoded and enormous (embedded images), so
decode it to a file with python, strip `data:image/…` blobs, then locate markers by line number.

⚠️ **But the Markdown export truncates multi-paragraph footnote bodies, and does it silently.**
It gave the QM doc's `[^19]` two of its five paragraphs and `[^1]` *one of seven*, with no marker,
no ellipsis, nothing — the definition simply ends early and reads as a complete note. Nothing
downstream can catch this; the post shipped a review looking perfectly consistent.

So take the markers and the figure positions from the Markdown export, but **take the footnote
bodies from `exportMimeType: "text/plain"`**. That export carries no images, so it stays small, and
it prints every note in full at the end of the document after a `________________` rule:

```
________________
[1] I’ll use footnotes for more in-depth comments…

Regarding my wording – “probabilities can cancel”…
[2] Technically, you need QM to explain…
```

Two things when parsing it: paragraph breaks inside a note are blank lines, and the marker
sometimes has **no space after it** (`[12]More specifically…`), so don't require one or you'll
silently skip those notes. Cross-check the paragraph count of every note against this export
before calling a transcription done. (`text/html` would carry it all too, but the export just
fails with *"File too large for export"* on a doc this size.)

**Don't just throw those blobs away — they are the doc's images, losslessly.** Every figure is a
`![][imageN]` reference plus an `[imageN]: <data:image/png;base64,…>` definition at the bottom, so
one `re.sub` over the definitions writes out every image *and* leaves a slim Markdown file whose
`![][imageN]` markers show exactly where each one sits in the prose — which is also the only
reliable way to see which figures are inside a table (i.e. a 2-wide or 3-wide) and which are
standalone. It is the same pass that strips the blobs; just write the bytes instead of dropping
them. Expect them at 1x (a 700 × 470 Figma frame comes back 700 × 470), so they are the finished
asset for photos and screenshots but only a *reference* for anything that also exists in Figma,
where you want a @2x export instead.

### Footnote markers in HTML you wrote by hand

A marker is substituted into the built page's text, so it needs to *be* text at that point —
which is nearly always. The two things to know:

- **`markdown-it-attrs` still binds `{…}` to the end of an inline run**, so anything that used
  to carry an attribute onto a marker has the same trailing-text hazard it always did. There is
  no longer any reason to put one there, though: sidenote placement is measured, not declared.
- **A marker inside an inline `<svg>` renders literally.** Put widget prose in HTML (`<p>`,
  `<figcaption>`) rather than in `<text>` if it needs a note.

The old rule — "the reference must sit in Markdown inline context, so rewrite the raw HTML
table as a pipe table" — no longer applies, and neither does the failure it caused, where a
marker in an `img.md` caption rendered literally *and silently deleted its own note*. Both are
worth remembering only as the reason `check.mjs` counts things instead of trusting the page to
look fine.

## Prose conventions

- **Curly quotes and apostrophes throughout** (`’ “ ”`), including inside heading text and
  TOC entries. Normalize the doc's stray straight quotes.
- **En dashes with spaces** (` – `) for parenthetical breaks, not `--` or em dashes.
- `*italic*` and `**bold**` (the sky post also uses `_…_`; either parses, prefer asterisks).
- `***triple***` for the occasional bold-italic key takeaway.
- External links get `{target="_blank"}`.
- The closing credits line ends with `{ .credits }`.
- Any pulled-out quotation is a real `> blockquote` — both external ones (Aaronson, Deutsch) and
  the author quoting his own earlier text back at the reader, which the QM post does three times.
  Styled in `_posts.scss`: a brand rule, some room, and **italics**.

  ⚠️ Because the whole quote is italic, `em`/`i` inside one is reset to upright — emphasis has to
  invert to still read as emphasis. So write the emphasis on the *word that matters*, never on the
  bulk of the sentence: `entire phantom *timelines* rather than simply phantom *copies*` is right,
  and `*entire phantom* timelines *rather than*` inverts to nonsense inside a quote even though it
  looks identical in a body paragraph.
- **A figure's source goes in `image-credit`, not in the caption.** The doc writes captions like
  “…performed with electrons by [Tonomura et al (1989)](…)”; split that — the caption keeps the
  description, the link moves to `image-credit`, and the “by” goes away, since the include already
  prefixes “Image: ”. That gets the source the small, dimmed, centred treatment every other credit
  on the site has.
- A displayed equation is a paragraph of its own carrying `{ .equation }` — centred and italic.
  One-line identities only; anything with a fraction or a summation needs real math typesetting.
- Superscripts and subscripts don't survive the export — `10^80` arrives as a bare `1080`. Restore
  with `<sup>`. Scan for suspicious runs of digits.
- Google Docs' own footnote text is sometimes truncated mid-sentence in the export (`…which posit
  that ` with nothing after it). That is the doc, not the export. Trim to a complete clause and
  leave an HTML comment rather than inventing the ending.

### Google Docs export artifacts to strip

The MCP text export mangles things. Clean all of these:

| Artifact | Fix |
|---|---|
| `\!` `\|` `\*` | Remove the backslash |
| `&#10;` in table cells | Real `<li>`/`<br>` in an HTML table |
| `\*\*Bold\*\*` inside tables | `<strong>` |
| Straight quotes `'` `"` | Curly `’` `“` `”` |
| Bold-wrapped headings (`## **Foo**`) | Plain `## Foo` |
| The doc's own inline CONTENTS list | Delete — the TOC include covers it |
| Non-breaking spaces (`\xa0`), often after an en dash | Regular space |
| Intra-doc links (`#heading=h.dc4ccfqdc7q5`) | Repoint at the post's own slug |

Non-breaking spaces are invisible and will make an otherwise-identical `Edit` call fail to
match. If a string replace mysteriously doesn't match, `repr()` the line in python first.

Emoji survive the export intact even when they render as `ð` mojibake in a terminal — read the
JSON directly rather than "fixing" them by guessing.

## Verifying

Load `http://localhost:8080/posts/<slug>/` and check the DOM rather than relying on
screenshots — this site has scroll-linked behavior that makes the screenshot tool capture the
wrong scroll offset. Useful checks: no literal `{%` left in the rendered text, table row counts,
`figure`/`figcaption` presence, and that every TOC href resolves:

```js
[...document.querySelectorAll('.toc a')].map(a=>a.getAttribute('href')).filter(h=>!document.querySelector(h))
```

Most of a transcription's failure modes are silent, so the mechanical checks live in a script that
reads the **built** HTML rather than the Markdown:

```bash
npm run check
```

`tools/check-post/check.mjs`. Each check in it caught something real: literal `{%` or `[^n]` left
in the body, a footnote defined but never referenced (dropped outright — the *count* is the only
tell), a note that reached the page as a reference but not as a sidenote or a list item, empty
paragraphs, a figure filename that drifted from its asset, and any image displayed above its own
resolution.

⚠️ **Compare footnote labels inside the source, never against the output's numbering.** Notes are
numbered by order of first reference, so removing `[^2]` renumbers everything after it and a
label-vs-number diff then reports the *last* footnote as missing. The first version of that check
did exactly this and produced a confident false positive. Count the three renderings against the
source's label set instead, which is what it does now.

### Telling a 1x export from a @2x one

Aim for `natural ÷ CSS width ≥ 2` on everything, and print the ratio for every image rather than
spot-checking. A Figma export that came back at 1x is invisible in review and obvious on a retina
screen a week later.

When the ratio is ambiguous — a 700-wide export could be a 700px frame at 1x or a 350px frame at
2x — measure the type. The site's mono labels are 13–15px, so **cap height lands around 21px at
@2x and around 11px at 1x**, whatever the frame size. Threshold the image and measure the ink
bands; `bloch-coin.png` (800 wide, known @2x) reads 21 and is a good yardstick. Erik's exports
have arrived as a mix of both in the same batch, so check each one.

---

# Building an interactive widget

`src/_includes/sky/pass-scatter-absorb.html` + `blue-sky.scss` + `blue-sky.js` are the reference
trio; `src/_includes/qm/hong-ou-mandel.svg` is the reference for a Figma-derived interactive SVG.
`src/_includes/qm/double-slit-paths.html` is the reference for a widget whose several inline SVGs
are all one picture — chart, setup and arrow equation sharing one coordinate story, with the
sliders locked to them (see *Welding a slider to the diagram it scrubs* and *Phase as hue*).
`src/_includes/qm/ramsey.html` is the reference for the biggest shape: a widget that *is* the whole
card — its own header, two panels and a caption panel rather than a drawing sitting inside the usual
30px of padding — stepped through five keyframes, reversible, and idling between them (see *Two
clocks*, *Copies that come and go* and *Reserving the height of the tallest of N cross-fading
panels*).

## A still of a widget should be rendered *from* the widget

Posts often walk through two or three frozen states of a thing before handing the reader the live
version — the QM post does exactly that with `double-slit-paths`. Don't ship the design file's
stills alongside it: they were drawn earlier, they drift, and here they were visibly a different
design (black wall bars against the widget's grey ones). Render them out of the widget instead and
they cannot disagree with it. `tools/double-slit-stills/render.mjs` is the pattern — it lifts the
widget's markup out of `_site`, inlines the compiled CSS and the mono `@font-face` over `file://`,
hides the controls the prose hasn't introduced yet, shims `requestAnimationFrame` onto `setTimeout`
(headless Chromium never fires a real one), and screenshots at `--force-device-scale-factor=2`.
Because the still and the live widget are laid out at the same width, they also line up exactly in
the article's flow, which is a nice tell that nothing has drifted.

Pick the frozen states by **solving** for them rather than dragging until it looks right: the three
double-slit stills sit where the path difference is exactly 0, λ/4 and λ/2, so the arrows are
aligned, a quarter turn apart, and exactly opposed by construction. Those numbers belong in the
renderer, with a comment pointing at the function that defines the geometry.

## The three-way split

Every widget is split across three files, one set **per post** — all of a post's widgets share
that post's single SCSS entrypoint and single JS file:

| Concern | Lives in |
|---|---|
| Markup | `src/_includes/<img_subdir>/<widget>.html` |
| Styles | `src/scss/<css>.scss` (the name in the post's `css:` frontmatter) |
| Behavior | `src/assets/js/<js>.js` (the name in the post's `js:` frontmatter) |

**Widget includes are markup only** — no `<style>`, no `<script>`. (`footer-bg.html` has an inline
script for a third-party bundle; don't copy that for post widgets.)

Root element is `<div id="<widget-name>" class="widget <family>-widget">`. The `id` is for one-off
CSS; the second class is the JS hook, queried with `querySelectorAll` so a widget can appear more
than once. `.widget` (`_posts.scss`) buys 30px padding, a 40px radius, and
`var(--widget-background-color)` (`#F5F5F5`).

New post? Create `src/_includes/<img_subdir>/`, add a `src/scss/<name>.scss` starting with
`@use "./posts" as *;`, and set `js: [post, <name>]`.

## ⚠️ No blank lines in any include

A blank line inside an include terminates the Markdown HTML block, and markdown-it re-parses
everything after it as prose — an SVG will be torn apart, with `<text>` becoming HTML elements
inside `<p>` tags. Every existing include has exactly zero blank lines. Use comments to separate
sections instead. Symptom: `getBBox is not a function`, or `svg.children` missing most of the file.

## JS house style

Bare IIFE, no `'use strict'`, no modules. Banner comment blocks in order: `CONSTANTS & CONFIG` →
`UTILITY FUNCTIONS` → `CORE LOGIC` → `UI UPDATES` → `HANDLERS` → `LISTENER WIRING` →
`INITIALIZATION`. `SCREAMING_SNAKE` constants at the top with unit comments; `_underscore` module
state; a local `$()` = `querySelector`. Pass a `$widget` element into functions rather than using
module state, so multiple instances work. Defensive early returns everywhere — one JS file serves a
whole post, so any given widget may be absent. `{ passive: true }` on `input` listeners, plain for
`click`/`keydown`. One `init()` at the bottom, wired with
`document.addEventListener('DOMContentLoaded', init, { once: true })`.

Drive visuals with `element.style.setProperty('--x', …)` rather than writing styles directly.

## SCSS house style

Banner comment sections matching the JS. Flat kebab-case selectors *indented* to mirror DOM depth
rather than `&`-nested — nesting is only for `&:hover` / `&::before` / state. Not BEM overall;
double-underscore only where there's a real element relationship (`gauge__bar--scattered`).
Tweakable numbers go in custom properties on the widget root, with a fallback at every `var()`.
Responsive is SCSS media-query mixins only (`@include w500`, `@include under-w900`) — no container
queries, no `transform: scale()`. A fixed-size SVG diagram needs none of that: `width: 100%` +
`max-width: <natural width>` scales it fluidly on its own.

State classes use the `is-` prefix (`is-running`, `is-used`, `is-lit`).

### Reserving the height of the tallest of N cross-fading panels is a grid job

When a widget swaps between several blocks of prose — Ramsey's five captions, and anything like
them — the height has to be reserved by the longest, or the page jolts every time the reader steps.
Do **not** measure them in JS. Put them all in the same grid cell:

```scss
.rm-captions { display: grid; }
.rm-caption  { grid-area: 1 / 1; opacity: 0; transition: opacity 220ms ease; pointer-events: none; }
.rm-caption.is-visible { opacity: 1; pointer-events: auto; }
```

The row's height is the max of its items for free, it stays correct through a resize and at every
breakpoint, and there is nothing to recompute. This is strictly better than the absolute positioning
`emission` uses for its mobile label band, and that widget is worth retrofitting.

### Controls

There is no shared button or range-input style — every control is styled per widget in the post's
stylesheet. Target a **class**, not an id (`blue-sky.scss` styles `#inverse-wavelength-slider` by
id; don't copy that). A custom range input needs all four vendor pseudo-elements, and both
`::-webkit-slider-thumb` and the input itself need `-webkit-appearance: none`:

```scss
.x-slider::-webkit-slider-runnable-track { … }
.x-slider::-webkit-slider-thumb { margin-top: calc((var(--track-h) - var(--thumb-h)) / 2); }
.x-slider::-moz-range-track { … }
.x-slider::-moz-range-thumb { box-sizing: border-box; … }   /* Firefox counts the border */
```

`.ds-slider` and `.te-scrubber` in `quantum.scss` are the two worked examples. A slider that is a
flex item also needs `min-width: 0`, or its intrinsic width floors the whole row.

### ⚠️ A custom property used inside `calc()` must carry a unit

This one fails **silently**, and it cost a round trip on the HOM marching ants:

```scss
--hom-ants-dash: 4;                                       /* ✗ bare number */
@keyframes m { to { stroke-dashoffset: calc(var(--hom-ants-dash) * -2); } }
```

`calc(4 * -2)` resolves to a `<number>`, not a `<length>`, so the keyframe's value is invalid and
the animation freezes — while `getComputedStyle(el).animationName` still reports the animation as
applied, and `getAnimations()` still returns one entry. The tell is that the computed value stays
literally `calc(-8px)` instead of resolving. Write `--hom-ants-dash: 4px`. (A *literal*
`stroke-dashoffset: -8` is fine; only `calc()` is strict.) Verify any dash/offset animation by
sampling, not by reading `animationName`:

```js
const a = el.getAnimations()[0];
[0, 225, 450].map(t => { a.currentTime = t; return getComputedStyle(el).strokeDashoffset; });
```

Note `getComputedStyle` returns a **live** object — re-read it after each mutation rather than
holding one reference, or every sample will read back identical.

## Sliders

`double-slit-pattern` is the reference. The Figma spec, measured off the export so nobody has to
re-measure it: **4px** track in `#D7D7D7` fully rounded, **20px** white thumb with a 1px
`--border-color` ring, label in `.label`'s 15px uppercase mono. Restyle all four pseudo-elements
(`::-webkit-slider-runnable-track`, `::-webkit-slider-thumb`, `::-moz-range-track`,
`::-moz-range-thumb`) and scope them by **class**, so one rule serves every slider in the widget;
`#inverse-wavelength-slider` in `blue-sky.scss` is the older, id-scoped precedent.

Every slider in the sky post labels its *ends* (`Visible Light` / `UV`) and never shows a number.
`double-slit-pattern` deliberately breaks that with a live `.ds-value` readout beside each label,
because its quantities are abstract and the ranges were meant to be tuned by eye. Prefer end labels
unless there is a similar reason.

Put label and input in their own `display: grid` with `grid-template-rows: 1fr auto`. That pushes
each label down against its slider, so a row stays aligned even when only one of the labels wraps
to two lines — which is what lets several sliders sit across a 343px phone.

### Welding a slider to the diagram it scrubs

`double-slit-paths`'s "position on wall" slider has to stand exactly over the spot its two paths
converge on, at every width. A native range thumb's **centre** travels `[half a thumb, width −
half a thumb]`, so a plain `width: 100%` slider runs out before the diagram does and the two drift
apart at both ends — by ~5% of the column, which reads as a physics bug rather than a layout one.

Fix it in CSS, not JS: widen the input by one thumb and pull it back by half.

```scss
.dsp-slider--position {
    width: calc(100% + var(--dsp-thumb-size, 20px));
    margin-inline: calc(var(--dsp-thumb-size, 20px) / -2);
}
```

The thumb-centre range is then exactly the column, so `value / max` maps straight onto the
drawing's `0 → viewBox width` and holds at any rendered size — no measuring, no `ResizeObserver`.
The overhang hides inside `.widget`'s 30px padding. Verified in page pixels at t = 0, 0.5 and 1:
thumb centre and wall point agree to 0.00px.

The corollary is that the slider and the drawing must be **the same element width**, i.e. in the
same column — which is why that widget stacks its column on a phone instead of putting all three
sliders in one row.

## Canvas widgets

`double-slit-pattern` is the only one, and everything else in the repo is DOM/SVG + CSS. What it
established:

- **The canvas buffer is a fixed size in the `width`/`height` attributes**, and CSS scales it with
  `width: 100%` + `aspect-ratio`. Do not size the buffer to the element or to `devicePixelRatio` —
  for a soft continuous field, resolution is purely a performance dial and the browser's upscale is
  free detail. Shrinking the buffer is the first thing to reach for if a render gets slow.
- **Coalesce renders with rAF**, one pending frame per widget in a `WeakMap`. A slider drag fires
  `input` faster than a field can be recomputed.
- Write into an `ImageData` `Uint8ClampedArray` with the colour conversion inlined. Do not build
  `hsl()` strings or call `fillRect` per pixel.
- Anything overlaid on the canvas (there, the wall with the two slits) positions off CSS custom
  properties in **percent**, so it tracks the canvas at any size with no JS on resize.
- Two things that must line up (the probability curve over the pattern) share **one coordinate
  system** — the SVG's `viewBox` is the canvas's buffer width, and both are `width: 100%`. Then a
  point in one stands over the same column in the other at every rendered size, for free.

⚠️ **Canvas is the wrong tool for crisp line art. Use SVG.** Only the continuous field needs a
canvas; the chart above it is an SVG `<path>` that quantum.js fills in, which stays sharp at any
width, keeps its colours and stroke width in SCSS, and needs no `getComputedStyle` round trip. Set
`vector-effect: non-scaling-stroke` so the line doesn't thicken as the widget grows.

That chart was first built as a canvas dot grid, and the reason it isn't one any more is worth
keeping: a 3px dot drawn at `x + 0.5` is antialiased across 4px at half alpha on both edges, and
on a 4px grid the half-alpha edges of neighbouring dots *touch* — filling the 1px gutter and
turning the grid into a smear. It reads as "why is this so blurry", and the instinct is to blame
CSS scaling. Check the buffer first, by sampling rather than squinting:

```js
const d = ctx.getImageData(0, y, w, 1).data;   // want α255 runs separated by α0, not α128 edges
```

So: `fillRect` only on whole pixels. The half-pixel usually gets added to centre a shape in its
cell — don't, the sub-pixel bias is invisible at these sizes and the antialiasing is not.

⚠️ **Think before renormalising a chart every frame.** The instinct is to rescale so the tallest
bar is always full height; it is usually wrong. In `double-slit-pattern` the physics fixes the
scale for you — two arrows in phase are twice one arrow, so a bright fringe is always `4/r`
whatever the sliders say — and pinning the chart to that constant means the centre is always full
height, outer fringes sit genuinely lower because they are further away, and a null reads as
empty. Per-frame renormalisation would have erased all three of those and made every setting look
equally bright. Look for the invariant the quantity already has.

⚠️ **Reach for physical simplification before algorithmic cleverness.** The first version gave each
slit a real width, which meant summing up to 64 Huygens sources per pixel — 150ms and undraggable.
That bought a per-row kernel table to claw the time back, ~40 lines of machinery. Then the slits
became single points, because a *reader* at that stage of the article should be thinking about two
paths and not about a slit self-interfering, and the whole optimization deleted itself: two sources
per pixel is 7ms naive, at full 600 × 240 resolution. The simplification that helps the reader
usually helps the profile too — look for it first. (Single-slit width is the thing to add back if
the envelope in a real photograph ever matters; it is a deliberate omission, not an oversight.)

## Phase as hue

Two widgets in the QM post colour a quantum phase, and they must agree, because the reader meets
them one after the other. The convention: **hue is the phase, and it runs backwards through the
wheel** — phase 0 is cyan, and a full turn goes cyan → blue → magenta → red → yellow → green →
cyan. That falls out of `hue = (atan2(im, re) / 2π + 0.5) * 6` with saturation pinned at 1, which
is why `paintDoubleSlitField()` can collapse HSV→RGB into a six-case switch. Keep that formula
inlined in the canvas loop; it is per-pixel.

### The SVG twin: one gradient per straight run, tiled

`double-slit-paths` draws the same wheel along a *path*, and the obvious implementation — a stop
every 60° of phase — is a trap: at a short wavelength a 138-unit leg is 46 wavelengths, so it is
~280 `<stop>` nodes per leg, rebuilt on every frame of a drag.

Instead: the ramp is periodic, so give the gradient a vector exactly **one wavelength long** and
`spreadMethod="repeat"`. Seven static stops in the markup, and a frame's work is four attributes.

- **One gradient per straight leg.** A gradient is linear; a bend is not. Split the polyline into
  `<line>`s, one per leg, each with its own gradient.
- **Carry the arc length.** Each leg starts at whatever phase the previous one ended on, so pull
  its gradient vector *back* down the leg by `arcLengthSoFar % wavelength`. That is what makes the
  colour run continuously through the bend. Verified exact: the gradient's own phase at the leg's
  start point matches `(arc / λ) mod 1` to four decimals at λ = 5, 12 and 33.
- **`href` on a gradient inherits its stops** (`<linearGradient id="x-far" href="#x-hue" …/>`), so
  the seven stops are written once and four legs share them. Works in Chrome; confirmed by
  rendering, not by reading the DOM — a broken reference paints black, not nothing.
- **Recalibrate value for the backdrop.** Full-brightness yellow is invisible on the pale `--iso-top`
  panel. The SVG stops are baked at value 0.85 (`#D9D900` etc.); the canvas twin sits on black and
  needs no such help. Same hue convention, different value — say so in a comment, or someone will
  "fix" the mismatch.

## Motion

Author keyframes in CSS, gate them on a state class, and guard reduced motion **twice** — a
`@media (prefers-reduced-motion: reduce)` block *and* a
`window.matchMedia('(prefers-reduced-motion: reduce)').matches` check in JS. Kill movement but keep
opacity-only transitions, which are what conveys state. A widget whose whole vocabulary is already
opacity-only needs nothing in the media query beyond freezing any looping animation.

If a node is created per-interaction, remove it on `animationend` (`{ once: true }`) so the DOM
stays bounded. Use the same event to take a state class **off** rather than a `setTimeout` paired
with a JS duration constant — that keeps the duration in CSS alone, where it can be tuned:

```js
retriggerAnimation($sensor, 'is-lit');   // remove class, force reflow, re-add
$lit.addEventListener('animationend', () => $sensor.classList.remove('is-lit'), { once: true });
```

Re-triggering mid-flight fires `animationcancel`, not `animationend`, so the superseded `{once:true}`
listener stays attached until the *next* animation ends and then removes the class redundantly —
harmless, and it does not leak.

## Simulations driven from JS

`initTravelingElectron` in `quantum.js` is the reference. Four rules, all of which the widget
would be worse without:

- **Freeze the randomness at init and make render a pure function of `t`.** Each dot draws its
  four normals once; `renderElectronCloud()` then computes position from `t` alone. The scrub
  slider and the rAF loop share one code path, and scrubbing backwards lands on exactly the
  arrangement it left. Jittering per frame would make the slider a one-way trip.
- **Gate the rAF loop on an `IntersectionObserver`** so it stops when the widget scrolls off
  screen, and clamp `dt` (`TE_MAX_FRAME`) so a backgrounded tab doesn't resume with one enormous
  step. `blue-sky.js`'s photon loop does neither; don't copy it.
- **Reduced motion means starting paused, not disabling playback.** Park the clock somewhere the
  picture is legible — `TE_REDUCED_MOTION_T` sits mid-sweep because `t = 0` is a single dot — and
  leave the play button working. Nothing goes in the CSS media query when the motion is all JS.
- **Do the maths in one normalised unit** (stage widths), then divide the vertical component by
  the stage's aspect ratio on the way into a `top` percentage. Skip that and the cloud renders as
  an ellipse that stretches as the stage widens. Percentages then survive most of a resize on
  their own; a `ResizeObserver` only has to redo the aspect correction.

DOM particles beat SVG here: a `viewBox` scaled to `width: 100%` would shrink 3px dots to 1.5px on
a phone, whereas absolutely-positioned divs in a `aspect-ratio` stage keep their pixel size.

### Stepping through keyframes over a continuous clock

`initEmission` in `quantum.js` is the reference for a widget the reader advances a step at a time
rather than watching play. It keeps the four rules above and adds three.

- **The clock stays continuous; keyframes are just values of `t`.** `EM_STEPS = [0, 0.05, 0.10,
  0.90, 1]` and the state is still one normalised `t`. The buttons search for the nearest keyframe
  *strictly past* the current `t` (hence `EM_EPSILON`, against float error), which is what makes
  them behave identically whether the reader arrived by pressing a button or by dragging the
  scrubber to some moment in between. A `currentStep` integer as the source of truth cannot answer
  "what comes next" from a scrubbed position at all.
- **Scale the tween duration with the distance travelled.** A lopsided timeline — three keyframes
  inside the first tenth, then one long haul to 0.9 — either crawls through the short hops or
  blurs past the long one under a fixed duration. `EM_TWEEN_MIN + (MAX - MIN) * span`.
- **Captions belong to keyframes, not to moments.** Labels hide the instant the clock moves (under
  a button or under the reader's thumb) and come back only on arrival. Reduced motion drops the
  tween and snaps — the step still happens, so nothing goes in the CSS media query.

### Two clocks, when a widget has to both step *and* idle

`initRamsey` in `quantum.js` is the reference. Emission gets by on one clock because it is still
whenever the reader is. Ramsey is not: its arrows have to keep turning while the reader reads, the
reader has to be able to rewind, and one step has to freeze the arrows in an exact pose. No single
clock does all three — a pure function of story position cannot idle, and a free-running clock
cannot be rewound. So there are two, and the split is by *what each one owns*:

| | `s` — the story | `tau` — physical time |
|---|---|---|
| range | a float in `[0, stepCount - 1]` | milliseconds |
| owns | positions, radii, opacities, connectors, particles | how far each arrow has turned |
| driven by | the tween, and only the tween | real time when idle; interpolated through a hop |
| reversible | exactly | on a hop, yes — it aims at the pose *behind* it |

**The rule that keeps them from disagreeing: every claim the widget makes must be a claim about a
*relative* angle between two arrows turning at the same rate, and those come from `s`.** Ramsey's
captions say the two ground copies are in step and the two excited ones oppose; both are differences
of same-rate arrows, so they hold at every `tau`, and `tau` is free to run without ever making a
caption untrue. An assertion about one arrow's absolute direction would not survive, and should be
a red flag that something belongs in the `s` table instead.

Consequences worth copying:

- **Pause the idle wherever the picture names a place.** Ramsey's arrows turn on three of its five
  steps and hold on the other two, and the reason is not decoration: the angle between the ground
  and excited arrows *is* the state's position on the Bloch sphere's equator, so leaving them
  turning while the caption says "we are at plus" would have the state quietly sliding past the
  point being described. Ask of every idle animation what quantity it is secretly changing.
- **Land on a pose, do not merely arrive.** Each step that names a place gets a *parity* rather than
  a time: even whole turns of the slow arrow put the pair parallel, odd ones put it opposed. A hop
  aiming at such a step interpolates `tau` to the nearest such moment in its direction of travel —
  forwards for NEXT, backwards for a rewind, which is what makes the arrows unwind and the equator
  arc retrace instead of lurching. `settle` then snaps `tau` to that target, so a dropped frame
  cannot leave the arrows a fraction of a turn short of what the step claims.
- **Choose the rates so the poses are the design file's.** With `ω_excited = 1.5 ω_ground`, every
  whole turn of the slow arrow brings *both* arrows back to upright while flipping their relative
  angle by half a turn — so the parallel and opposed poses land on one grid, and both are Figma
  frames. Picking 2× or 3× instead would have parked the pair at an arbitrary rotation. Solve for
  this; do not tune it.
- **One hop's length can be physics rather than taste.** Walking forward into the wait takes exactly
  as long as the arrows really need to come into opposition, because watching that happen is the
  whole of the step — and since the previous step parks them parallel, that is always exactly one
  turn of the slow arrow. Every other hop uses a designed duration and interpolates `tau` across it;
  nobody has a reference by which to judge an absolute rotation rate mid-transition.
- **Reduced motion needs a `tau` table, not `tau = 0`.** With no spin at all, the WAIT step would
  show two arrows both pointing up — the widget's central claim, drawn wrong. `RM_REDUCED_TAU` gives
  each keyframe the value of physical time at which it reproduces its own frame (`[0, 0, τ₁, τ₁,
  τ₁]`). This is also what makes reduced motion the right harness for fidelity diffs: it is the only
  mode in which every keyframe has one canonical pose.

### Two readouts of one quantity have to be driven by that quantity

Ramsey draws the relative angle between its two arrows twice: as the arrows themselves, and as how
far a blue arc has crept along the sphere's equator. Drive the second off the story position and
they drift — the sphere announces arrival at "minus" while the arrows on the left are still visibly
short of opposition, and no amount of tuning the easing fixes it, because one is eased in story time
and the other is linear in physical time. Drive the arc off `tau` and they cannot disagree:
`progress = relativeAngle(tau) / 180`. The test is worth writing as a *tracking* assertion sampled
every frame of the hop rather than a check at the endpoints, since the endpoints agree either way.

The exception proves the rule: on a hop that spans several steps there is no relative rotation to
keep pace with, so the arc falls back to the story position — a flag on the tween, not a guess.

### Make the effect follow its cause

The first version of Ramsey's blast tweened the pulse and the split over the same interval, so the
copies drifted apart *while* the microwaves were still approaching. Everything was smooth and it
read as two unrelated things happening at once. The fix is a second, delayed position — the story
runs on, the cast lags it — with the delay measured against the drawing rather than guessed:

```js
// the pulse's leading edge is level with the atoms at 0.37 of the hop, its tail clear by 0.65
const RM_SPLIT_DELAY = 0.34, RM_SPLIT_SPAN = 0.46;
function ramseyCastPosition(s) { … }   // identity outside a blast; equals s at every keyframe
```

Because it agrees with `s` exactly at the integers, no keyframe and nothing else in the widget has
to know it exists. And assert it as causation, not as timing: *at the frame the copies first
separate, where is the pulse?* — a test that survives every later change to the durations.

### Copies that come and go: `null` rows, and why birth is not a fade

A stepped widget whose cast changes needs a rule for a copy that does not exist yet. Ramsey's table
carries `null` for those rows and `expandRamseyCast()` fills them once at module scope:

- **Before a copy exists** it sits at its *parent's* position with magnitude 0. Since radius and
  arrow length are both derived from magnitude, it grows out of the copy it came from — and because
  it is fully opaque the whole time, there is never a moment where two translucent discs overlap.
  That matters more than it sounds: see *Two cross-fading discs are not a cross-fade* below, and
  note that here the parent is blue and the child is red, so a fade would have tinted it.
- **After a copy is gone** the last row is carried forward at opacity 0, so it fades where it stands
  rather than shrinking away to a point.

⚠️ **Anything added to the radius has to fade with it too.** The halo is `radius + 4` (or `+ 16`),
constant in the design file at every size — but at magnitude 0 that leaves a bare 16-unit red wash
sitting where the atom is about to appear, which reads as a bruise on the picture and looks nothing
like a bug in the table. Multiply the offset by `clamp(radius / smallestRadius, 0, 1)`.

### Derive every visual from one curve, not from several tuned to agree

The emission widget's photon count, red nucleus and orbital cloud all read
`emissionEmittedFraction(t)` — one exponential. When four fifths of the phantom copies have left,
the atom is four fifths grounded because it is *the same number*, not because two curves were
tuned until they looked right. A second hand-fitted opacity ramp is the kind of thing that stays
correct for one review and then quietly makes the physics wrong.

Corollary worth stating: **the design file is not a physics spec.** The emission frames imply three
mutually inconsistent decay rates (their own dot counts say one thing, their atom opacities
another), and Figma's angular spray is four rotated copies of one hand-placed cluster. Take the
distribution as the source of truth and the frames as illustration — then expect a permanent
residual when you diff, and do not "fix" it.

Ramsey is the same story with the numbers going the other way: `RM_UNIT_RADIUS * |amplitude|` gives
31 / 21.92 / 15.5 where Figma draws 31 / 22 / 15, and the arithmetic is right. Take the formula and
accept a half-pixel residual on the small copies.

⚠️ **A keyframe is a still, and some of what it draws is there to be looked at rather than to be a
resting state.** Ramsey's blast frames show the microwave pulse hanging in the middle of the picture
— which is how you check the dots read at all, not where the pulse is supposed to stop. Built that
way it looks frozen, because everything around it is moving. Ask which parts of a frame are the
state and which are the photographer; the answer is not in the file.

⚠️ **And the frames can disagree with *each other*.** Ramsey's Bloch sphere carries six little
direction arrows; frame 4 has the two upper ones pointing the opposite way to frames 1–3, and only
frames 1–3 agree with the direction the blue trail is actually drawn in. Decide which frame is the
spec **before** you diff, write down which one and why, and expect the other to score badly forever.
The tell that you are looking at a slip rather than at intent is that the odd frame contradicts
something the widget itself computes.

### ⚠️ Two cross-fading discs are not a cross-fade

The obvious way to fade a red atom into a blue one is two stacked circles, red at `1 - p` and blue
at `p`. It is wrong: total coverage is `1 - (1-0.8)(1-0.2) = 0.88`, so at mid-transition **12% of
the background shows through** — the card, and any particles behind it, come up through the middle
of the atom. It does not read as transparency; it reads as a muddy smudge, and the instinct is to
blame the colours.

Put the end state underneath at full opacity and fade only the top disc. What the reader sees of
the blue is exactly what the red has stopped covering, so the relationship still holds exactly
while the pair stays opaque at every `t`. One custom property instead of two.

Related, in the same widget: **paint order is three layers, not two.** The blurred orbital goes
under the particles (over them, its red tints them), the nucleus goes over the particles (under
them, copies that have only just left are drawn on top of the atom they left), and labels go over
everything (`z-index: 2`) or a dot lands mid-word once the spray fills the frame.

### ⚠️ Headless Chromium never fires `requestAnimationFrame`

Not with `--virtual-time-budget`, not with `--headless=new`, not with
`--run-all-compositor-stages-before-draw` — a bare rAF probe records **zero** frames. The Browser
pane is no better (its tab is usually `document.hidden`, which suspends rAF). So a rAF loop cannot
be verified by waiting for it anywhere. Replace the clock instead: shim `requestAnimationFrame` in
the harness *before* the widget script loads, then pump it with synthetic timestamps.

```html
<script>
  window.__q = new Map();
  window.__id = 0;
  window.requestAnimationFrame = fn => { const id = ++window.__id; window.__q.set(id, fn); return id; };
  window.cancelAnimationFrame = id => { window.__q.delete(id); };
  window.__pump = ts => { const q = [...window.__q]; window.__q.clear(); q.forEach(([, fn]) => fn(ts)); };
  window.__pumpCount = () => window.__q.size;
</script>
```

⚠️ **Key the queue by id, not by array index.** An earlier version of this shim pushed onto an array
and cancelled with `__q[id - 1] = null`, while `__pump` reset the array — so after the first pump
every id was off by however many frames had run, and `cancelAnimationFrame` silently cancelled the
wrong callback or none at all. Anything that cancels a frame (a scrub interrupting a tween, an
`IntersectionObserver` stopping a loop) then cannot be tested, and the symptom is a stray callback
resurrecting state a later assertion just set.

`__pumpCount()` earns its place: "a step queues a frame" and "reduced motion queues none" are the
cheapest way to assert that a tween started, or didn't.

This is better than wall-clock anyway — it makes the assertions exact. Pumping 3000 ms in 16.7 ms
steps advanced the electron's clock to 0.332 against a predicted 0.333, and a synthetic 4000 ms gap
confirmed the `dt` clamp by advancing exactly one 50 ms frame. Use `--force-prefers-reduced-motion`
on the same harness for the reduced-motion path.

⚠️ **Don't read a widget's clock off its scrubber.** `<input type=range max="1000">` quantises to
1/1000, which is coarser than one frame of an eased tween — so "50 ms advanced it" and "4000 ms
advanced it" both read back as the same integer and the `dt`-clamp assertion passes vacuously. Read
a float the widget already publishes instead and invert it: emission's `--em-excited-opacity` is
`exp(-3t)`, so `t = -ln(opacity) / 3` at full precision. Any assertion about sub-step motion needs a
continuous readout; the tell is a "passing" test whose before and after are identical.

Same trap one level up: **make sure the control is on the far side of the clamp you are testing.**
The first version of that test compared a 4000 ms frame against a 100 ms one — but `EM_MAX_FRAME` is
50 ms, so the control was clamped too and the test compared two identical numbers. Bracket the
threshold (30 ms / 50 ms / 4000 ms), don't straddle it.

Note the Browser pane also lays this site out at **zero width** — every `offsetWidth` reads 0 and
every geometric assertion silently passes. Check `document.body.offsetWidth` before believing any
measurement taken there; the headless harness is the place for layout numbers.

The "guard reduced motion **twice**" rule is about *JS-driven* motion. A widget whose only movement
is a CSS keyframe animation needs the `@media` block and nothing else — a `matchMedia` check in JS
that guards nothing is noise. `amplitude-multiplication` is the reference for that case.

## ⚠️ Retiring an affordance that is *currently animating*

The `.hom-ants` pattern — `animation` on the base rule, then `.is-used { opacity: 0; animation: none }`
plus a `transition: opacity` for a soft exit — **does not fade**. Chrome will not start a transition
on a property that a CSS animation was controlling when that animation is removed in the same style
change; the value just snaps. Measured on the amplitude glow: opacity went `0.318 → 0` with no
`CSSTransition` ever created. (The ants get away with it because their retirement animates opacity,
which `homAntsMarch` never touches — it only animates `stroke-dashoffset`. The rule of thumb is
per-*property*, not per-element.)

Fix: replace one animation with another rather than unsetting it.

```scss
.qam-grabber-glow            { animation: qamGlowPulse  var(--qam-pulse-speed) ease-in-out infinite; }
.qam-dial--factor.is-used
    .qam-grabber-glow        { animation: qamGlowRetire var(--qam-glow-fade) ease-out forwards; }
```

The retire keyframes have to pick a starting value (they can't know where the pulse was), so start
them at the pulse's top of cycle — the worst-case jump is then the pulse's own amplitude.

Two knock-on effects:

- **The reduced-motion block needs both selectors.** A bare `.qam-grabber-glow { animation: none }`
  is one class; the retirement rule is three, so it wins inside the media query too and keeps
  animating. List both, then restore the end state declaratively (`opacity: 0`) — with no animation
  left owning the property, a plain `transition` *does* fire there, and it's opacity-only, so it stays.
- **Tests can't tell the two apart by type.** Both are `CSSAnimation`; only `animationName`
  distinguishes them. Assert on `getAnimations().map(a => a.animationName)`.

## Drag interaction

`src/_includes/qm/amplitude-multiplication.svg` + `quantum.js` is the reference. Rules:

- **Pointer Events only.** One code path, never a `mouse*` + `touch*` pair.
- **`setPointerCapture` on `pointerdown`**, and hang `pointermove` / `pointerup` / `pointercancel`
  off the *same* element. Capture retargets them, so there is nothing to attach to `document` and
  nothing to tear down. Gate the move handler on `hasPointerCapture(e.pointerId)`.
- **`touch-action: none`** on the draggable element, or a touch-drag scrolls the page instead.
- **The generous shape is the hit target, not the handle.** These widgets scale down to ~40% on a
  phone, so a 25px knob becomes a 10px knob. Put the listener on the whole disc/panel.
- **Keyboard parity is not optional** — an SVG `<g>` gets `role="slider" tabindex="0"` plus explicit
  `keydown` handling, with `e.preventDefault()` so arrows and Home don't scroll. Follow the slider
  convention (Right/Up increase) rather than a spatial one; there is no intuitive spatial mapping
  for a rotary control anyway.
- ⚠️ **Do not call `focus()` from `pointerdown`.** It seems helpful (arrow keys work straight after
  a drag) but `preventDefault()` on `pointerdown` suppresses the compatibility `mousedown`, so
  Chrome never records a pointer as the input modality and treats the programmatic focus as
  keyboard-driven — painting the `:focus-visible` ring during an ordinary mouse drag. Verified:
  `g.matches(':focus-visible')` was `true` after a real drag. Let focus arrive via Tab.

### Client coordinates → SVG user space

Never reconstruct this from `getBoundingClientRect()` and a scale factor. Ask the SVG:

```js
const p = new DOMPoint(e.clientX, e.clientY).matrixTransform($g.getScreenCTM().inverse());
```

With the draggable parts wrapped in `<g transform="translate(cx cy)">`, `p` comes back in that
group's own space with the origin at its centre, and the widget's responsive scaling is already
folded in. Pair it with reading the geometry back off the SVG (`$circle.r.baseVal.value`) so no
dimension is written down twice — the same principle as `readSensorFace()` in the HOM widget.

Related: **the rendered SVG can *be* the state.** `readArrow()` recovers angle from the
`--qam-angle` custom property and magnitude from the shaft's own width, so there is no JS mirror
of the state to drift out of sync.

### ⚠️ `<line>` geometry is not reachable from CSS

SVG2 promoted `x`, `y`, `width`, `height`, `r`, `cx`, `cy` to CSS geometry properties — but **not**
`x1`/`y1`/`x2`/`y2` on `<line>`. So a line's length can't be driven by a custom property. Either
draw the shaft as a `<rect>` (whose `width` *is* a CSS property) or set it with `setAttribute`.
The split used here: rotation via `transform: rotate(var(--qam-angle))`, length via `setAttribute`.

### ⚠️ A CSS `transform` *replaces* a `transform` attribute — it does not compose with it

The natural way to place a repeated `<use>` is a transform attribute: `<use href="#tri"
transform="translate(68.44 43.44) rotate(135)"/>`. Add a counter-scale in the stylesheet
(`.tri { transform: scale(var(--scale)) }`) and the attribute is gone — all six of Ramsey's Bloch
direction markers collapsed onto the sphere's centre, which does not look like a cascade problem,
it looks like the placement maths is wrong. If both are needed, either nest a second `<g>` or scale
the referenced path inside `<defs>` instead. Usually the counter-scale is the thing to drop.

### Revealing a path progressively

Give it `pathLength="1"` in the markup and the progress is writable with nothing measured:

```scss
.rm-bloch-trail { stroke-dasharray: 1px 1px; stroke-dashoffset: var(--rm-trail, 1px); }
```
```js
$trail.style.setProperty('--rm-trail', `${(1 - progress).toFixed(4)}px`);   /* px is mandatory */
```

**One path per segment, not one path with computed fractions.** Ramsey's trail is three arcs, and
each hop of the story drives exactly one of them from 1 to 0, so the joins land on the labelled
points by construction rather than on a fraction of a combined arc length that has to be right to
four decimals. Note the unit: `stroke-dashoffset` takes a `<length>`, so a bare `0.42` is dropped
silently — the same family as the `calc()` trap above, and the same symptom (nothing moves).

### ⚠️ `offsetLeft` needs a positioned ancestor to mean what you want

Scrolling a horizontal rail to keep its active item in view compares `item.offsetLeft` against
`rail.scrollLeft` — but `offsetLeft` is measured from the nearest *positioned* ancestor, which for a
rail with no `position` is something much further up the page. The rail then scrolls to a plausible
wrong number, and only at the widths where it actually overflows, so it looks like an off-by-one in
the arithmetic. `position: relative` on the scroller fixes it.

(And it must be `scrollLeft`, not `scrollIntoView`: this site's post page scrolls in a container of
its own, so asking an element to bring itself into view moves the article instead.)

---

# Figma → inline SVG

Export the frame as SVG (`download_assets`, `defaultFormat: "svg"`). Figma layer names become `id`
attributes, so a tidily-named frame exports as readable markup. Then, by hand:

- **Drop the export's background rects** — the `#CCCCCC` export padding and the white page rect.
- **Keep `viewBox`, drop `width`/`height`** so it scales fluidly.
- **Rename ids**: `foo_2` → semantic names, `paint0_linear_345_2` → `<widget>-grad-<what>`,
  `clip0_345_2` → `<widget>-clip`. Update the `url(#…)` references too.
- **Convert text-as-paths to real `<text>`.** Figma exports type as outlines, which is dead weight
  (11 KB of the 19 KB in the HOM frame), unselectable, unreadable to screen readers, and invisible
  to search engines. To recover the exact type spec: the site's mono is 600/1000 em per glyph, so
  `ink_width ≈ 0.6 × chars × font-size` minus ~1.2px sidebearing per side. Parse the text path's
  bbox and solve. Set `text-anchor="middle"` at the ink centre; the baseline is the ink box's
  bottom for all-caps text.
- **Add classes, not ids, for JS/CSS hooks** — ids must stay unique if the widget is ever reused.
- **Give geometry a comment** when JS depends on it (e.g. the matrix defining a projected plane).

## Pulling Figma colour variables through to CSS

The design file has real Figma variables. Mirror them as `:root` custom properties in
`_base.scss` and reference them from the SVG — `fill="var(--iso-top)"` and
`<stop stop-color="var(--iso-top)"/>` both work in inline SVG, so no hex needs to appear twice.
Currently mapped: `Brand blue` → `--brand-color`, `--brand-orange`, and `isometric/top|left|right`
→ `--iso-top` / `--iso-left` / `--iso-right`, plus `--iso-*-far` for the 30%-white wash (see the
trap below).

Getting the values out of the MCP server is fiddlier than it looks:

- `get_variable_defs` only returns variables **actually used by the node you ask about**, so query
  a frame that uses the colour you want (the logo frame gives you `Brand blue`, the widget frame
  gives you the `isometric/*` set). There is no "list all variables" call.
- It rejects page and section nodes with a misleading *"You currently have nothing selected"*.
- `search_design_system` only finds **linked libraries**, never the file's own local variables.
- `get_metadata` on a whole page blows the SSE message limit and fails with a JSON parse error.
  Only query individual frames.
- Last resort for a colour with no queryable node: `get_screenshot` the page and histogram the
  pixels. ⚠️ That is how `--brand-orange` was once recorded here as `#E64C2E` — **wrong**. The
  token in `_base.scss` is `#FFA530`; `#E64C2E` is `--brand-red`. Read the value out of
  `_base.scss` rather than trusting a histogram, or a chart drawn in "brand orange" comes out red.

The isometric greys are the setup furniture, too, not just isometric faces: `double-slit-paths`
paints its ground panel and chart background `--iso-top` and its source box with an
`--iso-left → --iso-right` gradient, which is exactly what the Figma frame specifies.

## Keeping the export DRY

The raw export repeats itself heavily; three edits remove most of it.

- **One outline per shape.** Put the silhouette in `<defs>` unfilled and `<use>` it — once for the
  gradient fill, again for the dashed "marching ants" border. `fill`, `stroke`, `stroke-dasharray`
  and `stroke-dashoffset` are all *inherited*, so styling (and animating) the `<use>` reaches the
  referenced path inside its shadow tree. Beware that adding the end-cap arc so the ants hug the
  silhouette **enlarges the path's bounding box**, which silently rescales any
  `objectBoundingBox` gradient painted onto it — keep those in `userSpaceOnUse`.
- **Bounding-box gradients dedupe mirrored parts.** Figma emits one `userSpaceOnUse` gradient per
  copy. Converting to the default `objectBoundingBox` — `x1' = (x1 - bbox.x) / bbox.width`, etc. —
  makes a single def serve both the left and right copies of a part. Verified exact: converting
  the HOM bulb gradient moved no pixel by more than 3/765.
- **Let JS read geometry back out of the SVG** instead of hard-coding a copy of the matrix:

  ```js
  const m = $face.transform.baseVal.consolidate().matrix;   // a, b, c, d, e, f
  const x = m.a * u + m.c * v + m.e;
  const y = m.b * u + m.d * v + m.f;
  ```

  with `$face.width.baseVal.value` / `.height` for the local grid. The projection then lives in the
  SVG and nowhere else, and reusing the same linear part as the mark's own `transform` shears a
  circle into the correct isometric ellipse for free.

## Two blend/opacity traps

Figma composites against its white canvas, so exports quietly depend on an opaque backdrop:

1. **`mix-blend-mode` needs something to blend against.** Remove the background rect and an
   `overlay`-blended layer renders at full saturation (the HOM beam splitter went vivid blue).
   Fix: keep a backdrop rect filled with the *card's* colour, so it's invisible but real.
   Then note that Figma draws a recolouring layer across the shape's **bounding box**, not its
   silhouette, because `overlay` against pure white is a no-op and the overhang is invisible on
   the canvas. Against a grey card it is not: the tint rect shows as a pale box. Fix: clip the
   blend group to the artwork — `clip-path="url(#…-clip)"` over a path through the shape's outer
   corners. That keeps Figma's compositing maths exactly and just confines it.
2. **Semi-transparent "tint" layers are usually axis-aligned rects that overhang the artwork.**
   Invisible on white, visible as a pale box on a grey card. Fix: delete the tint and bake it into
   the fills beneath — `0.7 × base + 0.3 × 255` for a 30%-white wash
   (`#C4C4C4` → `#D6D6D6`, `#E9E9E9` → `#F0F0F0`, `#D5D5D5` → `#E2E2E2`). Those three washed
   values are the `--iso-*-far` tokens, so the arithmetic only ever happens once.
3. **Low-opacity fills need recalibrating, not copying.** Figma's `#D9D9D9` at 20% reads fine on
   its white canvas and nearly vanishes on the `#F5F5F5` card — bake it to a solid against the
   *card* (`--qam-dial-fill: #EFEFEF`). Same for strokes, with an extra twist: the site draws in
   `--text-color` (`#2d2d2d`), not black, so copying Figma's alpha across gives the wrong grey.
   The 0°-marker needed `opacity: 0.085` to land on Figma's rendered value, not the `0.1` the
   file says. Measure the rendered pixel, don't trust the number in the design file.

## Filter stacks usually reduce to plain shapes

Figma exports a glow as a ~20-line `feMorphology` + `feGaussianBlur` + `feComposite operator="out"`
chain. A `dilate` knocked out of its own source, sitting under an **opaque** shape, is pixel-identical
to a plain concentric circle behind that shape — and unlike the filter it can be animated and
themed. The amplitude-multiplication grabber is `<circle r="22.5">` + `<circle r="12.5">` plus
`filter: drop-shadow(0 0 2px …)` in CSS. Reproducing Figma's own pale blue that way landed on
`[211,239,250]` against its `[211,240,250]` — so the reduction is exact, and being plain shapes is
what then made the colour a one-line change.

⚠️ **That glow is now `--brand-orange`, deliberately, and no longer matches the Figma frame.** The
pale `#91D8F2` was near-invisible against the `#F5F5F5` card, and the affordance is the one thing
in the widget that has to be noticed. Don't "restore" it to match the design file; a fidelity diff
will show a large delta on the two knobs and that is expected.

## Checking fidelity against the Figma render

The Browser pane can't screenshot this site usefully (scroll-linked behavior; the pane's tab is
also often `document.hidden`, which suspends rAF so CSS animations never advance and
`animationend` never fires). Render with local headless Chromium instead — Brave is installed:

```bash
"/Applications/Brave Browser.app/Contents/MacOS/Brave Browser" --headless --disable-gpu \
  --hide-scrollbars --virtual-time-budget=3000 --window-size=800,600 \
  --screenshot=out.png "file:///path/to/harness.html"
```

Build a throwaway harness that inlines the SVG plus the compiled widget CSS and an
`@font-face` pointing at `src/assets/fonts/PPSupplyMono-Regular.otf` via `file://`. Two gotchas:
headless Chromium enforces a **~500px minimum window width**, so pin the subject with
`position:absolute; top:0; left:0` and a large window, then crop — otherwise it gets centred and
your diff is pure misalignment. And freeze animations (`animation: none !important`) for a
deterministic capture.

⚠️ **Zero out `.widget`'s own box in the harness** — `padding: 30px` is obvious, but it also carries
`border: 1px solid transparent`, which under border-box shrinks the SVG to 699px *and* offsets it.
That reads as a uniform 1px drift on every element and sends you hunting for a geometry bug that
isn't there. `#subject.widget { padding: 0; border: 0; }`. Diagnosis tell: the ink bounding boxes
are all the right *size* and all shifted the *same* direction.

Diff against `get_screenshot` of the same node (`maxDimension` equal to the frame's natural width
gives a 1:1 comparison). **Mask out the `<text>` bands before judging the number** — Figma's text
rasteriser is heavier than Chromium's, and the labels alone drag a whole-frame mean from ~1.5 up
past 8/765, which reads as a regression when nothing has moved. Score the artwork and the type
separately: artwork should come in around ~92% of pixels identical with a mean absolute
channel-sum delta under ~2, the residual sitting on antialiased diagonal and curved edges. A real
regression shows up as a *cluster* on a shape, not as a rim one pixel wide.

Also worth knowing before you read the number: **the design file is not necessarily self-consistent.**
In the amplitude-multiplication frame the grabbers sit 2.5–3.4px behind their own arrow tips, and
the "result" arrow is not the product of the two factors it is drawn beside (34.2°/0.76R vs the
31.7°/0.56R drawn). Decide which parts are the spec and which are illustration *before* diffing,
and expect a permanent residual on the rest.

⚠️ **`--virtual-time-budget` fast-forwards timers but not the animation clock.** `setTimeout`
callbacks fire in the right order, so a "wait 600ms then read the value" probe *looks* like it
worked — and reports the pre-transition value, which reads as a broken stylesheet. Chasing that
cost a round trip on the glow's reduced-motion path, which was correct all along. Never wait on
wall-clock in a harness; settle deterministically instead:

```js
el.getAnimations().forEach(a => a.finish());   // or a.currentTime = t to sample mid-flight
```

The same harness is the right place to assert behaviour, since it runs animations for real. Drive
the widget with synthetic events, scrub with `getAnimations()[0].currentTime = t`, and dump
readings into a `<pre>` that you scrape out of `--dump-dom`. Worth asserting: dash offset actually
advances, marks land inside the detector face (invert the face matrix and check `0 ≤ u ≤ w`), the
left/right split is ~50/50, and that no `transform` is animating on anything meant to hold still.

⚠️ **Start the probe on `load`, never on `setTimeout(0)`.** Under `--virtual-time-budget` the timer
task can be run *before* parsing finishes, which puts the probe ahead of the widget's own
`DOMContentLoaded` init. Every `dispatchEvent` then lands on an element with no listener yet, and
every read comes back as the untouched markup — `width="0"`, missing `x2`, empty `d`. It does not
look like a race; it looks like the widget is broken, because the numbers are all plausible zeros.
The tell is that the *final* `--dump-dom` is correct while every logged reading is not.

⚠️ **Wrap the probe body in `try`/`finally` and write the `<pre>` in the `finally`.** One throw
half-way through otherwise takes the whole log with it, and `--dump-dom` shows an empty `<pre>`
with no hint of why. The console line is there if you ask for it: add `--enable-logging=stderr`
and grep stderr for `CONSOLE`.

Also: give the harness the **viewport** width you mean to test, not just a narrow subject. Media
queries read the viewport, so `--window-size=820,x` with a 375px-wide column tests the desktop
stylesheet on a phone-width box and quietly proves nothing. Set `--window-size=375,900` and let
the column be `viewport − 94` (the site's content width under ~794px).

⚠️ **`requestAnimationFrame` never fires in headless Chromium** — there is no compositor, so rAF
callbacks queue and are never run (both `--headless` and `--headless=new`, with or without
`--virtual-time-budget`). Anything the widget defers to a frame simply never happens, and every
assertion after the first interaction silently reads the *initial* render — which looks like a
passing test if you only check that a number is plausible. Shim it in the harness, above the
widget's own script, so the real handler chain still runs:

```html
<script>window.requestAnimationFrame = fn => setTimeout(() => fn(performance.now()), 0);</script>
```

The same rAF suspension hits the Browser pane whenever it's hidden, where it shows up as
`javascript_tool` timing out rather than as a wrong answer. Verifying an rAF-driven widget through
the pane is not possible; use the harness.

⚠️ **Never time anything in the browser under `--virtual-time-budget`** — `performance.now()` is
clamped, so every measurement comes back as the timer floor (a suspiciously round, suspiciously
constant number like `4.0 ms` for both the cheapest and the most expensive settings — that pattern
*is* the tell). A widget that measured 4ms in the harness measured 150ms for real. To time a pure
computation, lift it into a node script with `process.hrtime.bigint()`; it needs no DOM.

⚠️ **Synthetic `PointerEvent`s do not create an active pointer**, so a real `setPointerCapture()`
throws `NotFoundError` and the drag never starts. Stub the three capture methods **in the harness**,
not in the widget — the test should carry the scaffolding:

```js
const _c = new Map();
Element.prototype.setPointerCapture = function (id) { _c.set(id, this); };
Element.prototype.hasPointerCapture = function (id) { return _c.get(id) === this; };
```

Then dispatch subsequent `pointermove`s at the capturing element, which is what capture really does.
Because that stub could hide a bug, finish with a **real**-input pass: serve a standalone copy of the
widget (`python3 -m http.server` on the scratchpad) and drive it through the Browser pane with
`computer{action:"left_click_drag"}` and `computer{action:"key"}`. That path exercised genuine
pointer capture and is what caught the `:focus-visible` bug above. Note the pane's screenshot space
is scaled relative to the viewport (0.625× at 1280 wide) — confirm the factor against a known
glyph's position before trusting drag coordinates.

## Measuring the responsive behaviour

The post page uses a custom scroll container, so `scrollIntoView` / `window.scrollTo` do nothing and
you cannot bring a mid-article widget into view to drive it. For *measurement* that doesn't matter —
`resize_window` then `javascript_tool` reading `getBoundingClientRect()` works at any scroll offset.
But call `resize_window` first: a freshly opened pane reports width `0` for everything.

**To actually *screenshot* something mid-article, drive it from a same-origin iframe.** Write a
throwaway probe into `_site/` (so the dev server serves it, and `npm run build` cleans it up),
point an iframe of the width you want at the post, then walk up from your target to whatever
element is really scrolling and set its `scrollTop` — instead of assuming it's the window:

```js
let el = target.parentElement, scroller = null;
while (el) {
  if (el.scrollHeight - el.clientHeight > 50 && /auto|scroll/.test(getComputedStyle(el).overflowY)) { scroller = el; break; }
  el = el.parentElement;
}
(scroller ?? window).scrollTop += target.getBoundingClientRect().top - 30;
```

Then `--screenshot` the outer page with headless Brave. It has to be same-origin — a `file://`
harness pointing at `localhost` cannot reach `contentDocument`, and the error looks like a
scripting bug rather than a CORS one.

The content column is widest around 768–900px, not at desktop, because `content-width` caps at 790px
and only adds the 45px padding at `w900`. Measured SVG width for a `max-width: 700px` widget
(`scale = (viewport − 94) / 700` while the viewport is under ~794):

| Viewport | 375 | 500 | 768 | 1280 |
|---|---|---|---|---|
| Rendered scale | 0.40 | 0.58 | 0.96 | 0.91 |

⚠️ Headless Chromium enforces a **~500px minimum window width**, so `--window-size=375,x` silently
runs at 500. The media queries under test are then the 500px ones, not the 375px ones. Pin the
column with an explicit CSS width and read `window.innerWidth` back in the log rather than trusting
the flag. `--headless=new` does not lift the floor and neither does `--force-device-scale-factor`;
the Browser pane's `resize_window` did not move the page's viewport either, when tried.

**The way that does work below 500: put the widget in an `<iframe>` of the width you want.** Media
queries inside an iframe evaluate against the iframe's own viewport, so a 375-wide frame in a
1200-wide headless window is a genuine 375px test — `window.innerWidth` inside reads 375, the
breakpoints fire, and the outer page can reach in and measure:

```bash
brave --headless --allow-file-access-from-files --window-size=1200,1400 --dump-dom frame.html
```

Two things that will bite: `--allow-file-access-from-files` is required or `contentWindow` is
cross-origin, and drive the widget with `--force-prefers-reduced-motion` so clicks snap — otherwise
every measurement is taken mid-tween and reads as a plausible zero.

### Counter-scaling two panels that do not scale together

Ramsey has a stage that fills whatever column it is given and a Bloch sphere capped at its natural
215px, side by side. One `--counter-scale` would over-correct the sphere, which sits at 1.0 through
the whole narrow range. Give each panel its own variable and comment why they differ.

The other non-obvious bit: **the stage's correction is not monotonic in viewport width.** It grows
as the column narrows, and then the breakpoint that stacks the sphere underneath hands the stage the
whole card back — so the scale jumps *up* and the correction has to be withdrawn (`under-w600`
resets `--rm-counter-scale` to 1). A band that resets rather than increases looks like a mistake;
say what it is for.

### Annotation labels over a drawing

`emission` is the reference. Figma places its labels at fixed pixel offsets in a 700px frame; the
translation that survives a resize is **percentages of the stage**, so the label tracks the thing it
points at for free. Two things that are not obvious:

- **A label's left edge and its width have to add up.** `left: 64.43%` plus `width: 36%` overflows by
  0.43% — three pixels, on the one edge nobody looks at. When a narrow band needs to win back
  characters, shrink the font, don't widen the column: the left edge is already fixed by the drawing.
- **Anchor the longest label to the floor, not to its centre.** A label centred on a `top` percentage
  grows both ways as the column narrows and it gains lines, and the lowest one runs out of the frame
  just before the breakpoint that would have rescued it. `top: auto; bottom: 4%` cannot.

Below `under-w600` the overlay stops working at any font size — a 229px column is a third of a 700px
card but four fifths of a phone. There the labels leave the drawing and stack into a band beneath it:
the stage's `aspect-ratio` grows (`700 / 620`), `--em-atom-y` moves the atom up to 34% to clear the
band, and every label lands in the same bottom-anchored slot with only the current one opaque — so
the height is reserved by the tallest and stepping never jolts the page.

That `--em-atom-y` is worth copying as a pattern: the drawing's placement stays in CSS (where the
media query lives) and `measureEmissionStage()` reads it back with `getComputedStyle` **once per
resize**, not per frame. JS gets the number it needs for the particle maths without owning the
layout, and there is no second copy of "where the atom is" to drift.

## Counter-scaling a wide diagram instead of reflowing it

`width: 100%; max-width: <natural>` is the whole responsive story for a *small* diagram (HOM is
390 wide, so it never drops below ~0.72). For a **700-wide** frame it isn't: at a 375px viewport
the SVG renders at 0.40, which makes 13px type 5.2px and a 1.75-unit stroke a 0.7px hairline.

The fix that keeps one SVG and one composition: leave the discs and all positions alone — a 70px
disc still beats the 44px touch minimum, and the drag target should be the whole disc anyway — and
multiply *only* the type and line weights back up. Two multipliers, because strokes and filled
marks have different perceptual floors: a sub-pixel stroke disappears, a small filled dot merely
looks small.

```scss
.amplitude-multiplication-widget {
    --qam-counter-scale: 1;        /* type + strokes */
    --qam-counter-scale-fill: 1;   /* filled marks */

    @include under-w700 { --qam-counter-scale: 1.12; --qam-counter-scale-fill: 1.06; }
    @include under-w600 { --qam-counter-scale: 1.32; --qam-counter-scale-fill: 1.15; }
    @include under-w500 { --qam-counter-scale: 1.60; --qam-counter-scale-fill: 1.28; }
    @include under-w400 { --qam-counter-scale: 1.95; --qam-counter-scale-fill: 1.42; }
}

.qam-label { font-size: calc(13px * var(--qam-counter-scale)); }
```

Every consumer states the **design** value once and multiplies, so the Figma numbers stay readable
in the source and the bands hold the label in a 10–13px window and strokes in a 1.3–1.7px one at
every width. Use max-width bands so nothing above 700 is touched — `under-w500`, `under-w600` and
`under-w700` were added to `_base.scss` for this.

Do **not** counter-scale anything a JS invariant depends on. The grabber and its glow are excluded
because `GRABBER_RADIUS` in `quantum.js` is what keeps magnitude 1 flush inside the disc; growing
the knob here would push it out through the rim.

### Two traps

- **CSS geometry properties need a unit.** `y`, `height`, `r`, `x`, `width`, `cx`, `cy` are real CSS
  properties on SVG shapes and *do* override the presentation attribute — but they take a
  `<length>`, so `height: 3.4` is dropped on the floor while `height: 3.4px` works (1px = 1 user
  unit). Same family as the `calc()` trap above. `stroke-width` is the exception: it takes a bare
  `<number>`, so `calc(1.746 * var(--scale))` is right there and `calc(1.746px * …)` would be wrong
  for the general case.
- ⚠️ **`baseVal` does not see CSS.** `$rect.height.baseVal.value` reflects the *attribute*, so a
  CSS geometry override reads back as if it never applied — it looks exactly like a silently
  dropped declaration. Check the used value with `getBBox()` or `getComputedStyle()` instead.
  (Reading `width.baseVal` is still correct where JS is the thing writing the attribute, as
  `readArrow()` does.)

---

# Offline video: the wavefunction studio

`tools/wavefunction-studio/` is the repo's first non-published authoring tool. It simulates a
quantum wave packet crossing a double slit, renders it as a 3-D height field, and exports the
looping mp4 at `src/assets/img/qm/wavefunction-in-3d.mp4`. Its own README covers the physics and
the traps; this section is about the pattern, for the next tool like it.

**Anything under `tools/` is invisible to Eleventy.** `.eleventy.js` sets `dir.input: "src"`, so no
`ignores` entry is needed — but note it also registers `js` and `scss` as *template formats*, so a
tool placed inside `src/` would get built and published. Keep tools out of `src/`.

`three` is pinned exactly (`"three": "0.170.0"`, no caret) as a devDependency and served out of
`node_modules` by the tool's own server through an import map. Nothing ships to readers; the
deliverable is the mp4. Pin exactly — three breaks `ShaderMaterial`, colourspace and addon-path
details across minor releases, and this tool should still run in two years.

## Verifying a tool like this

Split the checks by what they can actually prove:

| What | Where | Why not elsewhere |
|---|---|---|
| Physics | `node test-sim.mjs` | Plain ES module, no DOM. Runs against closed-form solutions. |
| Shaders | headless Brave + `check.html` | It is GPU code; only a real GL context can run it. |
| Composition | contact sheet PNG | Six frames across the loop, in one image. |

⚠️ **The Browser pane can do neither of the first two.** Its tab is hidden, which suspends
`requestAnimationFrame` *and* throttles `postMessage` round-trips to seconds per frame — a
240-frame render there took minutes and never finished. It also lays the page out at zero width,
so every geometric reading silently returns 0. Headless Brave needs
`--use-gl=angle --use-angle=swiftshader` for WebGL; plain `--disable-gpu` gives no GL context at all.

⚠️ **`--virtual-time-budget` fast-forwards timers but does not wait for CPU-bound work.** A long
export driven that way exits after a couple of seconds with the job barely started. Have the
*server* expose a status endpoint and poll it from the shell instead, with the browser launched
detached.

## Write the assertion against the thing you can see

Two bugs here were invisible to the obvious metric and turned up only by looking:

- The loop-seam metric said 0.2% while the loop visibly **popped**, because the packet was born
  on camera. Frame N really did equal frame 0 — the injection happens exactly at the boundary, so
  no seam metric could ever catch it. The fix was an entry corridor upstream of the visible square;
  the regression test now asserts on the packet's *brightness at the near edge*, run through the
  same gamma the shader uses.
- A "surface is not black" check passed at 0.1% lit while the render was, for practical purposes,
  black. Assertions on a field with three orders of magnitude of dynamic range have to be sampled
  **across the loop**, not at one frame, or they measure whichever end you happened to pick.

## Encoding notes that cost time to find

- **Keep the master in RGB.** A `yuv444p` master carries no colour tags, so `zscale` later fails
  with `no path between colorspaces`, and it puts two RGB→YUV conversions in one pipeline.
- **It has to be `ffv1`, not x264.** This ffmpeg's libx264 has no RGB output colourspace — asking
  for `-pix_fmt gbrp` silently gives back `yuv444p`. Check with
  `ffmpeg -h encoder=libx264 | grep -A2 "Supported pixel formats"`. ffv1 measured 25 ms/frame at
  2800×1800, comfortably ahead of the simulation.
- **Two-pass x264 needs identical GOP settings in both passes**, or pass 2 aborts with
  `different keyint setting than first pass`.
- **`local kbps="$1" out="…${kbps}…"` trips `set -u`.** Split the declaration.
- Budget reality: 240 frames of 1400×900 saturated field encoded to **2.7 MB at CRF 18** — the
  *highest* quality rung came in under the 3 MB target, because rendering at 2× and downscaling
  removes the high-frequency detail that would otherwise cost bitrate. Supersampling buys quality
  and compression at the same time.
