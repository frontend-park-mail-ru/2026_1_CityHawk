const AUTH_PATHS = ['/login', '/register'];

export function isAuthPath(pathname: string): boolean {
  return AUTH_PATHS.includes(pathname.trim());
}

export function getCurrentPathWithSearch(): string {
  return `${window.location.pathname}${window.location.search}`;
}

export function normalizeReturnTo(rawValue: string | null | undefined): string {
  const raw = String(rawValue || '').trim();

  if (!raw) {
    return '/';
  }

  try {
    const url = new URL(raw, window.location.origin);

    if (url.origin !== window.location.origin) {
      return '/';
    }

    if (isAuthPath(url.pathname)) {
      return '/';
    }

    const normalized = `${url.pathname}${url.search}`.trim();
    return normalized || '/';
  } catch {
    return '/';
  }
}

export function resolveReturnToFromSearch(search = window.location.search): string {
  const params = new URLSearchParams(search);
  return normalizeReturnTo(params.get('returnTo'));
}

export function buildAuthPath(authPath: '/login' | '/register', returnToRaw?: string): string {
  const normalizedReturnTo = normalizeReturnTo(returnToRaw);

  if (normalizedReturnTo === '/') {
    return authPath;
  }

  const params = new URLSearchParams();
  params.set('returnTo', normalizedReturnTo);
  return `${authPath}?${params.toString()}`;
}

export function decorateAuthSwitchLinks(root: ParentNode, returnTo: string): void {
  const normalizedReturnTo = normalizeReturnTo(returnTo);
  const loginHref = buildAuthPath('/login', normalizedReturnTo);
  const registerHref = buildAuthPath('/register', normalizedReturnTo);

  root.querySelectorAll<HTMLAnchorElement>('a[href="/login"]').forEach((anchor) => {
    anchor.href = loginHref;
  });

  root.querySelectorAll<HTMLAnchorElement>('a[href="/register"]').forEach((anchor) => {
    anchor.href = registerHref;
  });
}
