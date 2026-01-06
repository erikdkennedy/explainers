import path from "node:path";
import fs from "node:fs";
import { fileURLToPath } from "node:url";
import * as sass from "sass";
import MarkdownIt from "markdown-it";
import markdownItAttrs from "markdown-it-attrs";
import markdownItFootnote from "markdown-it-footnote";
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

  // Markdown library with attrs and footnotes (allow raw HTML in Markdown)
  const markdownLib = MarkdownIt({ html: true })
    .use(markdownItAttrs)
    .use(markdownItFootnote);
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

  // Transform: clone footnote text inline next to each reference (sidenotes)
  eleventyConfig.addTransform('inline-footnotes-sidenotes', (content, outputPath) => {
    if (!outputPath || !outputPath.endsWith('.html')) {
      return content;
    }
    try {
      const $ = cheerio.load(content);
      const $footnotesSection = $('section.footnotes');
      if ($footnotesSection.length === 0) {
        return content;
      }
      const footnoteMap = new Map();
      $footnotesSection.find('ol.footnotes-list > li.footnote-item').each((_, el) => {
        const $li = $(el);
        const id = $li.attr('id'); // e.g., "fn1"
        if (!id) {
          return;
        }
        // Clone the node so we can remove backref only from the cloned sidenote content
        const $clone = $li.clone();
        $clone.find('a.footnote-backref').remove();
        let html = ($clone.html() || '').trim();
        // Ensure we keep paragraph structure; if no block-level tag exists, wrap in a paragraph.
        // If a single <p> contains newline-separated text, split into multiple paragraphs.
        if (!/<\s*(p|ul|ol|table|div|blockquote|pre|figure)\b/i.test(html)) {
          html = `<p>${html}</p>`;
        } else {
          const singleP = html.match(/^\s*<p>([\s\S]*?)<\/p>\s*$/i);
          if (singleP && singleP[1] && singleP[1].includes('\n')) {
            const parts = singleP[1]
              .split(/\n+/)
              .map(s => s.trim())
              .filter(Boolean)
              .map(s => `<p>${s}</p>`);
            if (parts.length) {
              html = parts.join('');
            }
          }
        }
        if (html) {
          footnoteMap.set(id, html);
        }
      });
      // Insert a sidenote after each footnote reference
      $('sup.footnote-ref > a[href^="#fn"]').each((_, a) => {
        const $a = $(a);
        const href = $a.attr('href') || '';
        const fnId = href.replace(/^#/, '');
        const noteHtml = footnoteMap.get(fnId);
        if (!noteHtml) {
          return;
        }
        const $sup = $a.closest('sup.footnote-ref');
        // Detect the in-place marker on the link, sup, or any ancestor (e.g., td/th)
        const $markerAncestor = $a.closest('[data-render-sidenote-in-place]');
        const inPlaceAttr = (
          ($a.attr('data-render-sidenote-in-place')) ||
          ($sup.attr('data-render-sidenote-in-place')) ||
          ($markerAncestor.length ? $markerAncestor.attr('data-render-sidenote-in-place') : '') ||
          ''
        ).toLowerCase();
        const renderInPlace = inPlaceAttr === 'true';
        if (renderInPlace) {
          // In-place placement: use a block-level div. If inside a table, place after the nearest table.
          const $table = $a.closest('table');
          if ($table.length > 0) {
            const $sidenoteDiv = $(`<div class="sidenote" data-footnote-id="${fnId}"></div>`);
            $sidenoteDiv.html(noteHtml);
            $table.after($sidenoteDiv);
            return;
          }
          // Otherwise place after the nearest block container (same as default)
          const $blockInPlace = $a.closest('p, li, blockquote');
          if ($blockInPlace.length > 0) {
            const $sidenoteDiv = $(`<div class="sidenote" data-footnote-id="${fnId}"></div>`);
            $sidenoteDiv.html(noteHtml);
            $blockInPlace.after($sidenoteDiv);
            return;
          }
          // Fallback: after the reference itself
          const $sidenoteDiv = $(`<div class="sidenote" data-footnote-id="${fnId}"></div>`);
          $sidenoteDiv.html(noteHtml);
          $sup.after($sidenoteDiv);
          return;
        }
        // Default placement: after the nearest block-level container
        const $block = $a.closest('p, li, blockquote');
        if ($block.length > 0) {
          const $sidenoteDiv = $(`<div class="sidenote" data-footnote-id="${fnId}"></div>`);
          $sidenoteDiv.html(noteHtml);
          $block.after($sidenoteDiv);
          return;
        }
        // Fallback: insert after the reference itself
        const $sidenoteDiv = $(`<div class="sidenote" data-footnote-id="${fnId}"></div>`);
        $sidenoteDiv.html(noteHtml);
        $sup.after($sidenoteDiv);
      });
      return $.html();
    } catch {
      // On any parsing error, return original content so build doesn't fail
      return content;
    }
  });

  // allow includes w/o quotes
  eleventyConfig.setLiquidOptions({dynamicPartials: false});
  
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
