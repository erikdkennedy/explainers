import path from "node:path";
import fs from "node:fs";
import { fileURLToPath } from "node:url";
import * as sass from "sass";
import MarkdownIt from "markdown-it";
import markdownItAttrs from "markdown-it-attrs";
import { minify as terserMinify } from "terser";
import * as cheerio from "cheerio";

export default function(eleventyConfig) {
  eleventyConfig.addPassthroughCopy({ "src/assets": "assets" });
  eleventyConfig.addWatchTarget("src/scss");
  eleventyConfig.addWatchTarget("src/assets/css");
  eleventyConfig.addWatchTarget("src/assets/js");

  eleventyConfig.addTemplateFormats("scss");
  eleventyConfig.addExtension("scss", {
    outputFileExtension: "css",
    useLayouts: false,
    compile: async function(inputContent, inputPath) {
      const parsed = path.parse(inputPath);
      if (parsed.name.startsWith("_")) {
        return;
      }
      const result = sass.compile(inputPath, {
        loadPaths: [parsed.dir || ".", this.config.dir.includes],
        style: "expanded",
      });
      const dependencyFiles = (result.loadedUrls || [])
        .filter(u => u && u.protocol === "file:")
        .map(u => fileURLToPath(u));
      if (dependencyFiles.length) {
        this.addDependencies(inputPath, dependencyFiles);
      }
      return async () => result.css;
    },
  });

  // JavaScript: minify to .js
  eleventyConfig.addTemplateFormats("js");
  eleventyConfig.addExtension("js", {
    outputFileExtension: "js",
    useLayouts: false,
    compile: async function(inputContent, inputPath) {
      const result = await terserMinify(inputContent, {
        compress: true,
        mangle: true,
        format: { comments: false },
      });
      const code = result.code || "";
      return async () => code;
    },
  });

  // Markdown library with attrs and sidenote definitions (allow raw HTML in Markdown)
  const markdownLib = MarkdownIt({ html: true })
    .use(markdownItAttrs)
    .use(sidenoteDefinitions);
  // Remove empty paragraphs emitted from blank lines
  markdownLib.core.ruler.after('inline', 'remove_empty_paragraphs', (state) => {
    const filtered = [];
    for (let i = 0; i < state.tokens.length; i++) {
      const t = state.tokens[i];
      const t1 = state.tokens[i + 1];
      const t2 = state.tokens[i + 2];
      if (
        t && t.type === 'paragraph_open' &&
        t1 && t1.type === 'inline' && (t1.content || '').trim() === '' &&
        t2 && t2.type === 'paragraph_close'
      ) {
        i += 2; // skip empty paragraph trio
        continue;
      }
      filtered.push(t);
    }
    state.tokens = filtered;
  });
  eleventyConfig.setLibrary('md', markdownLib);

  // Paired shortcode to render Markdown inside an <aside>
  eleventyConfig.addPairedShortcode('aside', (content, cls = 'aside') => {
    return `<aside class="${cls}">${markdownLib.render(content)}</aside>`;
  });

  // Paired shortcode to wrap Markdown inside a <div class="inset"> wrapper
  eleventyConfig.addPairedShortcode('inset', (content, cls = 'inset') => {
    return `<div class="${cls}">${markdownLib.render(content)}</div>`;
  });

  // Paired shortcode: render inline Markdown (use 'block' to render with paragraphs)
  eleventyConfig.addPairedShortcode('md', (content, mode = 'inline') => {
    if ((mode || '').toString().toLowerCase() === 'block') {
      return markdownLib.render(content);
    }
    return markdownLib.renderInline(content);
  });
  // Ensure availability in Liquid templates explicitly
  if (typeof eleventyConfig.addPairedLiquidShortcode === 'function') {
    eleventyConfig.addPairedLiquidShortcode('md', (content, mode = 'inline') => {
      if ((mode || '').toString().toLowerCase() === 'block') {
        return markdownLib.render(content);
      }
      return markdownLib.renderInline(content);
    });
  }

  // Shortcode: current year (useful for copyright footers)
  eleventyConfig.addShortcode('year', () => new Date().getFullYear());

  // Filter: resolve meta image path if it exists; else return empty string
  eleventyConfig.addFilter('meta_image_path', (imgSubdir) => {
    if (!imgSubdir || typeof imgSubdir !== 'string') {
      return '';
    }
    const filename = `${imgSubdir}.png`;
    const absolutePath = path.resolve('src/assets/img/meta', filename);
    if (fs.existsSync(absolutePath)) {
      return `/assets/img/meta/${filename}`;
    }
    return '';
  });

  // Final safety net: strip empty paragraphs from generated HTML
  eleventyConfig.addTransform('strip-empty-paragraphs', (content, outputPath) => {
    if (outputPath && outputPath.endsWith('.html')) {
      return content
        // Remove <p></p>, <p>\n</p>, <p>&nbsp;</p>, <p><br/></p>, etc.
        .replace(/<p>(?:\s|&nbsp;|<br\s*\/?>)*<\/p>/g, '');
    }
    return content;
  });

  // Transform: resolve `[^label]` references wherever they landed, and emit both the
  // margin sidenotes and the bottom-of-page list from the SAME definition HTML.
  //
  // References are matched against the built HTML's *text nodes* rather than during inline
  // Markdown parsing, which is what lets a marker work inside an img.md caption, a raw HTML
  // table cell, or a widget include — all places markdown-it's inline rule never reaches.
  // The definitions themselves are still Markdown; sidenoteDefinitions() (below) moves them
  // to a hidden block at the end of the document so they render through the normal pipeline.
  eleventyConfig.addTransform('sidenotes', (content, outputPath) => {
    if (!outputPath || !outputPath.endsWith('.html')) {
      return content;
    }
    try {
      const $ = cheerio.load(content);
      const $defs = $('.fn-defs');
      if ($defs.length === 0) {
        return content;
      }

      // label -> rendered definition body, in source order.
      const defs = new Map();
      $defs.find('.fn-def').each((_, el) => {
        const label = $(el).attr('data-fn-label');
        if (label) defs.set(label, ($(el).html() || '').trim());
      });
      $defs.remove();

      // Text nodes we must not rewrite: code keeps its literal text, and a marker inside
      // <svg><text> would need a <tspan>, which is more than this is worth.
      const SKIP = new Set(['pre', 'code', 'script', 'style', 'textarea', 'svg']);
      const MARKER = /\[\^([^\]\s]+)\]/g;

      // Reference order is document order, which is also the numbering. A definition that
      // nothing references is dropped (check-post flags it) — same contract as before.
      const seen = [];
      const refCount = new Map();
      const refHtml = (label) => {
        const n = seen.indexOf(label) + 1;
        // A note may be pointed at from more than one place. It stays one note with one
        // number; only the ids have to be made unique, and the first reference keeps the
        // bare one so the bottom list's backref still has somewhere to go.
        const k = (refCount.get(label) || 0) + 1;
        refCount.set(label, k);
        const id = k === 1 ? `fnref-${label}` : `fnref-${label}-${k}`;
        return `<sup class="fn-ref" id="${id}" data-fn="${label}">` +
               `<a class="fn-ref__link" href="#fn-${label}">` +
               `<span class="fn-ref__marker" aria-hidden="true"></span>` +
               `<span class="fn-ref__n">${n}</span>` +
               `</a></sup>`;
      };

      const walk = (node) => {
        if (node.type === 'tag' && SKIP.has(node.name)) return;
        const children = node.children ? [...node.children] : [];
        for (const child of children) {
          if (child.type === 'text') {
            const text = child.data || '';
            if (!MARKER.test(text)) { MARKER.lastIndex = 0; continue; }
            MARKER.lastIndex = 0;
            let out = '';
            let last = 0;
            let m;
            while ((m = MARKER.exec(text)) !== null) {
              const label = m[1];
              if (!defs.has(label)) continue;         // leave a dangling marker visible
              if (!seen.includes(label)) seen.push(label);
              out += escapeHtmlText(text.slice(last, m.index)) + refHtml(label);
              last = m.index + m[0].length;
            }
            if (!out) continue;
            out += escapeHtmlText(text.slice(last));
            $(child).replaceWith(out);
          } else if (child.type === 'tag') {
            walk(child);
          }
        }
      };
      const $article = $('article');
      walk(($article.length ? $article : $('body')).get(0));

      if (seen.length === 0) {
        return $.html();
      }

      // One aside per note, all in a single container that JS positions against the
      // references. Keeping them out of the flow is what lets a note sit level with a
      // marker inside a table cell or a figure caption.
      const asides = seen.map((label, i) =>
        `<aside class="sidenote" id="sn-${label}" data-fn="${label}">` +
        `<div class="sidenote__body">${defs.get(label)}</div>` +
        `</aside>`).join('');
      $('.post-body').append(`<div class="sidenotes">${asides}</div>`);

      // The bottom-of-page list, shown wherever there is no room for a margin. Rendered
      // from the same `defs` HTML, so the two can no longer disagree.
      const items = seen.map((label, i) =>
        `<li class="footnote-item" id="fn-${label}" value="${i + 1}">${defs.get(label)}` +
        `<a class="footnote-backref" href="#fnref-${label}">\u21a9\ufe0e</a></li>`).join('');
      $('.post-body').append(
        `<hr class="footnotes-sep"><section class="footnotes">` +
        `<ol class="footnotes-list">${items}</ol></section>`
      );

      return $.html();
    } catch {
      // On any parsing error, return original content so build doesn't fail
      return content;
    }
  });

  // allow includes w/o quotes
  eleventyConfig.setLiquidOptions({dynamicPartials: false});

  // Eleventy's dev server defaults to 8080 and does not look at PORT on its own. Honouring it
  // here lets a tool that hands us a free port (a worktree running alongside another checkout,
  // say) get the server it asked for, while a plain `npm run serve` still lands on 8080.
  if (process.env.PORT) {
    eleventyConfig.setServerOptions({ port: Number(process.env.PORT) });
  }


  return {
    dir: {
      input: "src",
      includes: "_includes",
      layouts: "_layouts",
      output: "_site"
    },
    templateFormats: ["md", "html"],
    markdownTemplateEngine: "liquid",
    htmlTemplateEngine: "liquid",
    dataTemplateEngine: "liquid"
  };
}

/*****************************************
        SIDENOTE DEFINITIONS (Markdown)
*****************************************/

// `[^label]: body` definitions are lifted out of the document and re-appended as a hidden
// block of `<div class="fn-def">`s at the end. Two reasons this beats markdown-it-footnote:
//
//   1. It keeps every definition, referenced or not. markdown-it-footnote silently drops the
//      unreferenced ones, which is how a marker that landed in a caption used to delete its
//      own note and renumber everything after it.
//   2. Bodies still go through the ordinary Markdown pipeline (blank lines around the
//      wrapper divs are what re-enter Markdown context), so links, emphasis and multiple
//      paragraphs all work, and there is exactly one rendering of each note.
//
// References are NOT handled here — see the `sidenotes` transform, which resolves them
// against the built HTML so they also work in captions, raw HTML tables and widget markup.
function sidenoteDefinitions(md) {
  md.core.ruler.after('normalize', 'sidenote_definitions', (state) => {
    if (state.inlineMode) return;

    const lines = state.src.split('\n');
    const kept = [];
    const defs = [];
    let fence = null;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      // Never read a definition out of a code fence.
      const fenceMatch = /^\s*(```+|~~~+)/.exec(line);
      if (fenceMatch) {
        fence = fence && line.trim().startsWith(fence) ? null : (fence || fenceMatch[1]);
        kept.push(line);
        continue;
      }
      if (fence) { kept.push(line); continue; }

      const m = /^\[\^([^\]\s]+)\]:[ \t]*(.*)$/.exec(line);
      if (!m) { kept.push(line); continue; }

      // Continuation lines are indented 4 spaces (or a tab); a blank line only continues
      // the note if an indented line follows it.
      const body = [m[2]];
      while (i + 1 < lines.length) {
        const next = lines[i + 1];
        if (/^\s*$/.test(next)) {
          if (/^(?: {4}|\t)/.test(lines[i + 2] || '')) { body.push(''); i++; continue; }
          break;
        }
        if (/^(?: {4}|\t)/.test(next)) { body.push(next.replace(/^(?: {4}|\t)/, '')); i++; continue; }
        break;
      }
      defs.push({ label: m[1], body: body.join('\n').trim() });
    }

    if (!defs.length) return;

    const block = defs
      .map(d => `<div class="fn-def" data-fn-label="${d.label}">\n\n${d.body}\n\n</div>`)
      .join('\n\n');
    state.src = `${kept.join('\n')}\n\n<div class="fn-defs" hidden>\n\n${block}\n\n</div>\n`;
  });
}

// Text taken out of a cheerio text node and put back as markup has to be re-escaped, or a
// stray `<` in prose becomes a tag.
function escapeHtmlText(s) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
