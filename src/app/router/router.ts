import type {
  NavigateOptions,
  RouteCleanup,
  RouteMatch,
  RouteRenderer,
  RouteView,
} from '../../types/router.js';

interface RouterOptions {
  root: HTMLElement;
  routes: Record<string, RouteRenderer>;
  notFound: RouteRenderer;
}

function escapeRouteSegment(segment: string): string {
  return segment.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function buildRoutePattern(routePath: string): {
  regex: RegExp;
  paramNames: string[];
} {
  const parts = routePath.split('/').filter(Boolean);
  const paramNames: string[] = [];

  if (parts.length === 0) {
    return {
      regex: /^\/$/,
      paramNames,
    };
  }

  const pattern = parts
    .map((part) => {
      if (part.startsWith(':')) {
        paramNames.push(part.slice(1));
        return '([^/]+)';
      }

      return escapeRouteSegment(part);
    })
    .join('/');

  return {
    regex: new RegExp(`^/${pattern}/?$`),
    paramNames,
  };
}

function getPathname(path: string): string {
  try {
    return new URL(path, window.location.origin).pathname;
  } catch {
    return '/';
  }
}

export class Router {
  private readonly root: HTMLElement;

  private readonly routes: Record<string, RouteRenderer>;

  private readonly notFound: RouteRenderer;

  private cleanup: RouteCleanup | null;

  constructor({ root, routes, notFound }: RouterOptions) {
    this.root = root;
    this.routes = routes;
    this.notFound = notFound;
    this.cleanup = null;
    this.onPopState = this.onPopState.bind(this);
    this.onDocumentClick = this.onDocumentClick.bind(this);
  }

  start(): void {
    window.addEventListener('popstate', this.onPopState);
    document.addEventListener('click', this.onDocumentClick);
    void this.renderByPath(window.location.pathname);
  }

  navigate(path: string, { replace = false }: NavigateOptions = {}): void {
    const resolvedPath = typeof path === 'string' && path ? path : '/';
    const method = replace ? 'replaceState' : 'pushState';
    window.history[method](null, '', resolvedPath);
    void this.renderByPath(window.location.pathname);
  }

  onPopState(): void {
    void this.renderByPath(window.location.pathname);
  }

  onDocumentClick(event: MouseEvent): void {
    if (event.defaultPrevented || event.button !== 0) {
      return;
    }

    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
      return;
    }

    const target = event.target;
    if (!(target instanceof Element)) {
      return;
    }

    const link = target.closest('a[href]');
    if (!(link instanceof HTMLAnchorElement)) {
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
    const nextUrl = new URL(href, window.location.origin);
    this.navigate(`${nextUrl.pathname}${nextUrl.search}`);
  }

  async renderByPath(path: string): Promise<void> {
    if (typeof this.cleanup === 'function') {
      this.cleanup();
      this.cleanup = null;
    }

    const pathname = getPathname(path);
    const match = this.matchRoute(pathname);
    const renderer = match?.renderer || this.notFound;
    const view = await renderer({
      path: pathname,
      params: match?.params || {},
      navigate: this.navigate.bind(this),
    });
    const html = typeof view === 'string' ? view : view?.html || '';

    this.root.innerHTML = html;

    if (view && typeof view !== 'string' && typeof view.mount === 'function') {
      const cleanup = view.mount(this.root);
      if (typeof cleanup === 'function') {
        this.cleanup = cleanup;
      }
    }
  }

  matchRoute(path: string): RouteMatch | null {
    for (const [routePath, renderer] of Object.entries(this.routes)) {
      const { regex, paramNames } = buildRoutePattern(routePath);
      const match = path.match(regex);

      if (!match) {
        continue;
      }

      const params: Record<string, string> = {};
      paramNames.forEach((paramName, index) => {
        params[paramName] = decodeURIComponent(match[index + 1] || '');
      });

      return {
        renderer,
        params,
      };
    }

    return null;
  }
}
