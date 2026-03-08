import { pageLayout } from '../templates/layout.js';

export function registerPage() {
  return pageLayout({
    title: 'Register',
    description: 'Страница регистрации пользователя.',
  });
}
