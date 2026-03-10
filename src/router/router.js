export class Router {
  constructor({ root, routes, notFound }) {
    this.root = root;
    this.routes = routes;
    this.notFound = notFound;
    this.cleanup = null;
    this.onPopState = this.onPopState.bind(this);
    this.onDocumentClick = this.onDocumentClick.bind(this);
  }

  start() {
    window.addEventListener('popstate', this.onPopState);
    document.addEventListener('click', this.onDocumentClick);
    this.renderByPath(window.location.pathname);
  }

  navigate(path, { replace = false } = {}) {
    const resolvedPath = typeof path === 'string' && path ? path : '/';
    const method = replace ? 'replaceState' : 'pushState';
    window.history[method](null, '', resolvedPath);
    this.renderByPath(resolvedPath);
  }

  onPopState() {
    this.renderByPath(window.location.pathname);
  }

  onDocumentClick(event) {
    if (event.defaultPrevented || event.button !== 0) {
      return;
    }

    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
      return;
    }

    const link = event.target.closest('a[href]');
    if (!link) {
      return;
    }

    if (link.target && link.target !== '_self') {
      return;
    }

    const href = link.getAttribute('href');
    if (!href || href.startsWith('#')) {
      return;
    }

    if (/^[a-zA-Z][a-zA-Z\d+\-.]*:/.test(href)) {
      return;
    }

    event.preventDefault();
    this.navigate(new URL(href, window.location.origin).pathname);
  }

  async renderByPath(path) {
    if (typeof this.cleanup === 'function') {
      this.cleanup();
      this.cleanup = null;
    }

    const renderer = this.routes[path] || this.notFound;
    const view = await renderer({ path, navigate: this.navigate.bind(this) });
    const html = typeof view === 'string' ? view : view?.html || '';

    this.root.innerHTML = html;

    if (view && typeof view.mount === 'function') {
      const cleanup = view.mount(this.root);
      if (typeof cleanup === 'function') {
        this.cleanup = cleanup;
      }
    }
  }
}
