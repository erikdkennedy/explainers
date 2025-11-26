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