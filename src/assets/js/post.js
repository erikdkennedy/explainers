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

  Places each margin note level with the marker that refers to it — a pure function of
  measured geometry, so a resize, a web font arriving, or a widget changing height just
  re-runs the same code.

  Markup comes from the `sidenotes` transform in .eleventy.js: a `.fn-ref` per reference and
  a `.sidenote` per note, paired by `data-fn`. Below the sidenote breakpoint none of this
  runs and the bottom-of-page list is what the reader sees.
*****************************************/

(() => {
    /*  CONSTANTS & CONFIG  */

    const SN_MEDIA = '(min-width: 1400px)';

    /*  MODULE STATE  */

    let _pairs = [];
    let _body = null;
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
            // A note pointed at from several places belongs beside the first of them.
            const anchor = pair.refs[0].getBoundingClientRect();
            const wanted = anchor.top - origin.top + nudge;
            const top = Math.max(wanted, floor);
            pair.note.style.setProperty('--sn-top', `${Math.round(top)}px`);
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

        _notes.classList.add('sidenotes--ready');
    }

    function scheduleSidenoteLayout() {
        if (_frame) return;
        _frame = requestAnimationFrame(() => {
            _frame = 0;
            layoutSidenotes();
        });
    }

    /*  INITIALIZATION  */

    function initSidenotes() {
        _body = $('.post-body');
        _notes = $('.sidenotes');
        if (!_body || !_notes) return;

        const byLabel = new Map();
        for (const ref of document.querySelectorAll('.fn-ref[data-fn]')) {
            const label = ref.dataset.fn;
            if (!byLabel.has(label)) {
                const note = $(`.sidenote[data-fn="${CSS.escape(label)}"]`, _notes);
                if (!note) continue;
                byLabel.set(label, { note, refs: [] });
            }
            byLabel.get(label).refs.push(ref);
        }
        _pairs = [...byLabel.values()];
        if (!_pairs.length) return;

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
