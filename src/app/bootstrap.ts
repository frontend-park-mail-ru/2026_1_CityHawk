import { Router } from './router/router.js';
import { homePage } from '../pages/home/home-page.js';
import { eventListPage } from '../pages/event-list/event-list-page.js';
import { eventCreatePage } from '../pages/event-create/event-create-page.js';
import { eventEditPage } from '../pages/event-edit/event-edit-page.js';
import { eventDeletePage } from '../pages/event-delete/event-delete-page.js';
import { loginPage } from '../pages/login/login-page.js';
import { passwordResetPage } from '../pages/password_reset/password_reset-page.js';
import { registerPage } from '../pages/register/register-page.js';
import { notFoundPage } from '../pages/not-found/not-found-page.js';
import { eventPage } from '../pages/event/event-page.js';
import { profilePage } from '../pages/profile/profile-page.js';
import { loadTemplates, renderTemplate } from './templates/renderer.js';
import type { RouteRenderer } from '../types/router.js';

const root = document.getElementById('root');

if (!(root instanceof HTMLElement)) {
  throw new Error('Root element #root not found');
}

async function startApp(): Promise<void> {
  await loadTemplates();

  const routes: Record<string, RouteRenderer> = {
    '/': homePage,
    '/events': eventListPage,
    '/events/new': eventCreatePage,
    '/events/:eventId/edit': eventEditPage,
    '/events/:eventId/delete': eventDeletePage,
    '/events/:eventId': eventPage,
    '/login': loginPage,
    '/profile': profilePage,
    '/password_reset': passwordResetPage,
    '/register': registerPage,
  };

  const router = new Router({
    root,
    routes,
    notFound: notFoundPage,
  });

  router.start();
}

startApp().catch((error: unknown) => {
  console.error(error);
  root.innerHTML = renderTemplate('app-error');
});
