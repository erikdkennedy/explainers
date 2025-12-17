import path from "node:path";
import { fileURLToPath } from "node:url";
import * as sass from "sass";
import MarkdownIt from "markdown-it";
import markdownItAttrs from "markdown-it-attrs";
import { minify as terserMinify } from "terser";

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

  // Markdown library with attrs (allow raw HTML in Markdown)
  const markdownLib = MarkdownIt({ html: true }).use(markdownItAttrs);
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

  // Final safety net: strip empty paragraphs from generated HTML
  eleventyConfig.addTransform('strip-empty-paragraphs', (content, outputPath) => {
    if (outputPath && outputPath.endsWith('.html')) {
      return content
        // Remove <p></p>, <p>\n</p>, <p>&nbsp;</p>, <p><br/></p>, etc.
        .replace(/<p>(?:\s|&nbsp;|<br\s*\/?>)*<\/p>/g, '');
    }
    return content;
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
