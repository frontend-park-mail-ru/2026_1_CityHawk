export interface NavigateOptions {
  replace?: boolean;
}

export interface RouteContext {
  path: string;
  params: Record<string, string>;
  navigate: (path: string, options?: NavigateOptions) => void;
}

export type RouteCleanup = () => void;

export interface RouteView {
  html: string;
  mount?: (root: HTMLElement) => void | RouteCleanup;
}

export type RouteRenderer = (
  context: RouteContext,
) => string | RouteView | Promise<string | RouteView>;

export interface RouteMatch {
  renderer: RouteRenderer;
  params: Record<string, string>;
}
