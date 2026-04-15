import { Router } from './router/router.js';
import { loadTemplates, renderTemplate } from './templates/renderer.js';
import type { RouteRenderer } from '../types/router.js';

const rootNode = document.getElementById('root');

if (!(rootNode instanceof HTMLElement)) {
  throw new Error('Root element #root not found');
}

const root = rootNode;

function lazyRoute<TModule extends Record<string, unknown>>(
  loader: () => Promise<TModule>,
  exportName: keyof TModule,
): RouteRenderer {
  return async (context) => {
    const module = await loader();
    const renderer = module[exportName];

    if (typeof renderer !== 'function') {
      throw new Error(`Route export "${String(exportName)}" is not a function`);
    }

    return (renderer as RouteRenderer)(context);
  };
}

async function startApp(): Promise<void> {
  await loadTemplates();

  const routes: Record<string, RouteRenderer> = {
    '/': lazyRoute(() => import('../pages/home/home-page.js'), 'homePage'),
    '/events': lazyRoute(() => import('../pages/event-list/event-list-page.js'), 'eventListPage'),
    '/events/new': lazyRoute(() => import('../pages/event-create/event-create-page.js'), 'eventCreatePage'),
    '/events/:eventId/edit': lazyRoute(() => import('../pages/event-edit/event-edit-page.js'), 'eventEditPage'),
    '/events/:eventId/delete': lazyRoute(() => import('../pages/event-delete/event-delete-page.js'), 'eventDeletePage'),
    '/events/:eventId': lazyRoute(() => import('../pages/event/event-page.js'), 'eventPage'),
    '/login': lazyRoute(() => import('../pages/login/login-page.js'), 'loginPage'),
    '/profile': lazyRoute(() => import('../pages/profile/profile-page.js'), 'profilePage'),
    '/password_reset': lazyRoute(() => import('../pages/password_reset/password_reset-page.js'), 'passwordResetPage'),
    '/register': lazyRoute(() => import('../pages/register/register-page.js'), 'registerPage'),
  };

  const router = new Router({
    root,
    routes,
    notFound: lazyRoute(() => import('../pages/not-found/not-found-page.js'), 'notFoundPage'),
  });

  router.start();
}

startApp().catch((error: Error | null | undefined) => {
  console.error(error);
  root.innerHTML = renderTemplate('app-error');
});
