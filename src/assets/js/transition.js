// Cross-document View Transitions for same-origin navigations
(() => {
  if (!('startViewTransition' in document) || !('navigation' in window)) return;

  navigation.addEventListener('navigate', (event) => {
    const toUrl = new URL(event.destination.url);
    // Only same-origin, non-hash, non-download, non-form navigations
    if (!event.canIntercept) return;
    if (toUrl.origin !== location.origin) return;
    if (event.hashChange || event.downloadRequest || event.formData) return;
    // No-op if path is the same (avoids reloading current page)
    if (toUrl.pathname === location.pathname && toUrl.search === location.search) return;

    event.intercept({
      handler: async () => {
        const vt = document.startViewTransition(async () => {
          const response = await fetch(toUrl, { headers: { 'X-Requested-With': 'view-transition' } });
          const html = await response.text();
          const doc = new DOMParser().parseFromString(html, 'text/html');
          // Replace head and body to emulate navigation while preserving transition
          document.documentElement.replaceChild(doc.head, document.head);
          document.documentElement.replaceChild(doc.body, document.body);
        });
        try {
          await vt.finished;
        } catch {
          // Swallow if transition was aborted
        }
      },
    });
  });
})();

