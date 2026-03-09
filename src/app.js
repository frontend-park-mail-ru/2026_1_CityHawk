import { Router } from './router/router.js';
import { refresh } from './lib/api.js';
import { homePage } from './pages/home.js';
import { loginPage } from './pages/login.js';
import { registerPage } from './pages/register.js';
import { notFoundPage } from './pages/not-found.js';
import { loadTemplates } from './templates/renderer.js';

const root = document.getElementById('root');

if (!root) {
  throw new Error('Root element #root not found');
}

async function startApp() {
  await loadTemplates();

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
  refresh().catch(() => {});
}

startApp().catch((error) => {
  console.error(error);
  root.innerHTML = `
    <section class="card">
      <h1>Ошибка загрузки</h1>
      <p>Не удалось инициализировать приложение.</p>
    </section>
  `;
});
