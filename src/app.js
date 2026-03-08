import { Router } from './router/router.js';
import { refresh } from './lib/api.js';
import { homePage } from './pages/home.js';
import { loginPage } from './pages/login.js';
import { registerPage } from './pages/register.js';
import { notFoundPage } from './pages/not-found.js';

const root = document.getElementById('root');

if (!root) {
  throw new Error('Root element #root not found');
}

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
