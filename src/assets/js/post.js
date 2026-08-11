document.addEventListener("DOMContentLoaded", () => {
  const tocLinks = document.querySelectorAll(".toc a[href^='#']");

  const sections = [];
  tocLinks.forEach(link => {
    const href = (link.getAttribute("href") || "").trim();
    // Skip invalid or empty anchors like "#"
    if (!href || href === "#" || !href.startsWith("#") || href.length <= 1) return;

    const id = href.slice(1);
    const selector = "#" + (window.CSS && CSS.escape
      ? CSS.escape(id)
      // Fallback escaping for older browsers
      : id.replace(/([!"#$%&'()*+,./:;<=>?@\[\]^`{|}~\s])/g, "\\$1"));

    let el;
    try {
      el = document.querySelector(selector);
    } catch (_) {
      return; // invalid selector, skip
    }
    if (el) sections.push(el);
  });

  if (!sections.length) return;

  const observer = new IntersectionObserver(entries => {
    const visible = entries.filter(e => e.isIntersecting);
    if (!visible.length) return;
    const top = visible.sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
    tocLinks.forEach(link => {
      const href = (link.getAttribute("href") || "").trim();
      const active = href && top.target.id && href === `#${top.target.id}`;
      link.classList.toggle("active", !!active);
    });
  }, { rootMargin: "0px 0px -70% 0px", threshold: 0.1 });

  sections.forEach(s => observer.observe(s));
});

/*****************************************
                SIDENOTES

  Places each margin note level with the marker that refers to it, and draws the connector
  between the two. Both are pure functions of measured geometry, so a resize, a web font
  arriving, or a widget changing height just re-runs the same code.

  Markup comes from the `sidenotes` transform in .eleventy.js: a `.fn-ref` per reference and
  a `.sidenote` per note, paired by `data-fn`, plus one `.sidenote-wires` <svg> spanning
  .post-body. Below the sidenote breakpoint none of this runs and the bottom-of-page list is
  what the reader sees.
*****************************************/

(() => {
    /*  CONSTANTS & CONFIG  */

    const SN_MEDIA = '(min-width: 1400px)';
    const SN_WIRE_ENTRY = 9;        // px down a note's box that its wire attaches
    const SN_WIRE_CLEAR = 4;        // px of air at each end of a wire
    const SN_WIRE_RADIUS = 6;       // corner rounding on the elbow
    const SN_WIRE_LANES = [0.5, 0.28, 0.72];   // fractions across the gutter, cycled

    /*  MODULE STATE  */

    let _pairs = [];
    let _body = null;
    let _wires = null;
    let _notes = null;
    let _extraPad = 0;
    let _frame = 0;

    /*  UTILITY FUNCTIONS  */

    const $ = (sel, root = document) => root.querySelector(sel);
    const num = (el, prop) => parseFloat(getComputedStyle(el).getPropertyValue(prop)) || 0;

    /*  CORE LOGIC  */

    // A note wants to sit level with its marker, and settles for as close below that as the
    // note before it allows. Notes are in document order, so one pass down the column places
    // the lot; the running `floor` is the only state it needs.
    function layoutSidenotes() {
        if (!_pairs.length || !window.matchMedia(SN_MEDIA).matches) return;

        const origin = _body.getBoundingClientRect();
        const gap = num(_body, '--sn-gap');
        const nudge = num(_body, '--sn-nudge');
        let floor = -Infinity;
        let lowest = 0;

        for (const pair of _pairs) {
            // A note pointed at from several places belongs beside the first of them; the
            // later markers get their own wire down to it instead of fighting over its top.
            const anchor = pair.refs[0].getBoundingClientRect();
            const wanted = anchor.top - origin.top + nudge;
            const top = Math.max(wanted, floor);
            pair.note.style.setProperty('--sn-top', `${Math.round(top)}px`);
            pair.top = top;
            pair.refYs = pair.refs.map(ref => {
                const r = ref.getBoundingClientRect();
                return r.top - origin.top + r.height / 2;
            });
            floor = top + pair.note.offsetHeight + gap;
            lowest = Math.max(lowest, top + pair.note.offsetHeight);
        }

        // Notes are out of flow, so a run of them near the end of an article would otherwise
        // spill past .post-body and over the footer. Give the column back whatever height it
        // is short — measured against the article's own height, not the padded one, or each
        // pass would add to the last.
        const natural = _body.scrollHeight - _extraPad;
        const needed = Math.max(0, Math.ceil(lowest - natural) + 20);
        if (needed !== _extraPad) {
            _extraPad = needed;
            _body.style.paddingBottom = needed ? `calc(20px + ${needed}px)` : '';
        }

        drawSidenoteWires(origin);
        _notes.classList.add('sidenotes--ready');
    }

    // One wire per pair, confined to the gutter: it leaves the column edge at the marker's
    // own line and arrives at the note's shoulder. Starting it at the marker itself was the
    // obvious thing and it is wrong — the curve then has to cross the whole text column, and
    // a note pushed a few hundred px down drags its wire straight through the prose (and,
    // in the case that motivates all this, through a table). The line the marker sits on is
    // enough to identify it, and the gutter is the only place a wire can live quietly.
    //
    // Routed as an orthogonal elbow with rounded corners rather than as one curve: the
    // gutter is ~50px wide and a displaced note can be several hundred px down, so a single
    // cubic across it is a near-vertical squiggle. An elbow drops down the gutter, which is
    // the one direction there is room in, and a note that landed level with its marker
    // degenerates to a plain horizontal rule.
    //
    // Lanes are staggered so a cluster of notes pushed down together — the case this whole
    // exercise is about — doesn't draw every wire on top of the same vertical.
    function drawSidenoteWires(origin) {
        const notesLeft = _notes.getBoundingClientRect().left - origin.left;
        const columnRight = origin.width - parseFloat(getComputedStyle(_body).paddingRight);
        _wires.setAttribute('viewBox', `0 0 ${origin.width} ${_body.scrollHeight}`);
        _wires.setAttribute('width', origin.width);
        _wires.setAttribute('height', _body.scrollHeight);

        const x1 = columnRight + SN_WIRE_CLEAR;
        const x2 = notesLeft - SN_WIRE_CLEAR;
        const span = x2 - x1;

        _pairs.forEach((pair, i) => {
            const y2 = pair.top + SN_WIRE_ENTRY;
            pair.wires.forEach((wire, j) => {
                const y1 = pair.refYs[j];
                const dy = y2 - y1;

                if (Math.abs(dy) < 1) {
                    wire.setAttribute('d', `M ${x1} ${y1} H ${x2}`);
                    return;
                }
                const lane = x1 + span * SN_WIRE_LANES[(i + j) % SN_WIRE_LANES.length];
                const r = Math.min(SN_WIRE_RADIUS, Math.abs(dy) / 2, Math.abs(lane - x1), Math.abs(x2 - lane));
                const dir = Math.sign(dy);
                wire.setAttribute('d',
                    `M ${x1} ${y1} H ${lane - r}` +
                    ` Q ${lane} ${y1} ${lane} ${y1 + dir * r}` +
                    ` V ${y2 - dir * r}` +
                    ` Q ${lane} ${y2} ${lane + r} ${y2}` +
                    ` H ${x2}`);
            });
        });
    }

    function scheduleSidenoteLayout() {
        if (_frame) return;
        _frame = requestAnimationFrame(() => {
            _frame = 0;
            layoutSidenotes();
        });
    }

    /*  HANDLERS  */

    function setSidenoteActive(pair, on) {
        pair.refs.forEach(ref => ref.classList.toggle('is-active', on));
        pair.wires.forEach(wire => wire.classList.toggle('is-active', on));
        pair.note.classList.toggle('is-active', on);
    }

    /*  INITIALIZATION  */

    function initSidenotes() {
        _body = $('.post-body');
        _notes = $('.sidenotes');
        _wires = $('.sidenote-wires');
        if (!_body || !_notes || !_wires) return;

        const NS = 'http://www.w3.org/2000/svg';
        const byLabel = new Map();
        for (const ref of document.querySelectorAll('.fn-ref[data-fn]')) {
            const label = ref.dataset.fn;
            if (!byLabel.has(label)) {
                const note = $(`.sidenote[data-fn="${CSS.escape(label)}"]`, _notes);
                if (!note) continue;
                byLabel.set(label, { note, refs: [], wires: [], top: 0, refYs: [] });
            }
            const pair = byLabel.get(label);
            const wire = document.createElementNS(NS, 'path');
            wire.setAttribute('class', 'sidenote-wire');
            _wires.appendChild(wire);
            pair.refs.push(ref);
            pair.wires.push(wire);
        }
        _pairs = [...byLabel.values()];
        if (!_pairs.length) return;

        for (const pair of _pairs) {
            for (const el of [...pair.refs, pair.note]) {
                el.addEventListener('pointerenter', () => setSidenoteActive(pair, true));
                el.addEventListener('pointerleave', () => setSidenoteActive(pair, false));
            }
            for (const ref of pair.refs) {
                ref.addEventListener('focusin', () => setSidenoteActive(pair, true));
                ref.addEventListener('focusout', () => setSidenoteActive(pair, false));
            }
        }

        layoutSidenotes();

        // .post-body's own height changes whenever anything inside it does — an image
        // loading, a widget growing, the column reflowing — which is every case that moves a
        // marker. One observer covers the lot.
        new ResizeObserver(scheduleSidenoteLayout).observe(_body);
        window.addEventListener('resize', scheduleSidenoteLayout, { passive: true });
        if (document.fonts && document.fonts.ready) {
            document.fonts.ready.then(scheduleSidenoteLayout);
        }
        window.addEventListener('load', scheduleSidenoteLayout);
    }

    document.addEventListener('DOMContentLoaded', initSidenotes, { once: true });
})();


/*****************************************
      SIDENOTE STYLE SWITCHER (temporary)

  Scaffolding for choosing between the three treatments. Delete with the include and the
  stylesheet block of the same name.
*****************************************/

(() => {
    const SN_KEY = 'sidenote-style';
    const SN_STYLES = ['a', 'b', 'c'];

    function applySidenoteStyle(style) {
        document.documentElement.setAttribute('data-sidenote-style', style);
        document.querySelectorAll('.sn-switcher__btn').forEach(btn => {
            btn.classList.toggle('is-current', btn.dataset.snStyle === style);
        });
    }

    function initSidenoteSwitcher() {
        const $switcher = document.querySelector('.sn-switcher');
        if (!$switcher) return;

        const fromUrl = new URLSearchParams(location.search).get('sidenotes');
        const stored = (() => { try { return localStorage.getItem(SN_KEY); } catch { return null; } })();
        const initial = [fromUrl, stored].find(s => SN_STYLES.includes(s)) || 'a';
        applySidenoteStyle(initial);

        $switcher.addEventListener('click', e => {
            const btn = e.target.closest('.sn-switcher__btn');
            if (!btn) return;
            applySidenoteStyle(btn.dataset.snStyle);
            try { localStorage.setItem(SN_KEY, btn.dataset.snStyle); } catch { /* private mode */ }
            window.dispatchEvent(new Event('resize'));
        });
    }

    document.addEventListener('DOMContentLoaded', initSidenoteSwitcher, { once: true });
})();
