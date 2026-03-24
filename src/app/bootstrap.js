import { Router } from './router/router.js';
import { refresh } from '../api/auth.api.js';
import { homePage } from '../pages/home/home-page.js';
import { loginPage } from '../pages/login/login-page.js';
import { registerPage } from '../pages/register/register-page.js';
import { notFoundPage } from '../pages/not-found/not-found-page.js';
import { loadTemplates, renderTemplate } from './templates/renderer.js';

const root = document.getElementById('root');

if (!root) {
  throw new Error('Root element #root not found');
}

/**
 * Инициализирует шаблоны, обновляет состояние авторизации и запускает роутер.
 *
 * @returns {Promise<void>}
 */
async function startApp() {
  await loadTemplates();
  await refresh().catch(() => {});

  const router = new Router({
    root,
    routes: {
      '/': homePage,
      '/login': loginPage,
      '/register': registerPage,
    },
    notFound: notFoundPage,
  });

  router.start();
}

startApp().catch((error) => {
  console.error(error);
  root.innerHTML = renderTemplate('app-error');
});
