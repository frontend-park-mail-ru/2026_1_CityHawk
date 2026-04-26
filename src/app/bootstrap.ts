import { Router } from './router/router.js';
import { loadTemplates, renderTemplate } from './templates/renderer.js';
import { initSupportLauncher } from '../components/support-launcher/support-launcher.js';
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
    let module: TModule;
    try {
      module = await loader();
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error || '');
      const isChunkLoadError = message.includes('ChunkLoadError')
        || message.includes('Loading chunk');
      const reloadGuardKey = '__cityhawk_chunk_reload_attempted__';

      if (isChunkLoadError && !sessionStorage.getItem(reloadGuardKey)) {
        sessionStorage.setItem(reloadGuardKey, '1');
        window.location.reload();
        throw error;
      }

      sessionStorage.removeItem(reloadGuardKey);
      throw error;
    }

    sessionStorage.removeItem('__cityhawk_chunk_reload_attempted__');
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
    '/support-widget': lazyRoute(() => import('../pages/support-widget/support-widget-page.js'), 'supportWidgetPage'),
    '/support-widget/new': lazyRoute(() => import('../pages/support-widget/support-widget-page.js'), 'supportWidgetPage'),
    '/support-widget/tickets': lazyRoute(() => import('../pages/support-widget/support-widget-page.js'), 'supportWidgetPage'),
    '/support-widget/tickets/:id': lazyRoute(() => import('../pages/support-widget/support-widget-page.js'), 'supportWidgetPage'),
    '/support/statistics': lazyRoute(() => import('../pages/support-statistics/support-statistics-page.js'), 'supportStatisticsPage'),
  };

  const router = new Router({
    root,
    routes,
    notFound: lazyRoute(() => import('../pages/not-found/not-found-page.js'), 'notFoundPage'),
  });

  router.start();
  initSupportLauncher();
}

startApp().catch((error: Error | null | undefined) => {
  console.error(error);
  root.innerHTML = renderTemplate('app-error');
});
