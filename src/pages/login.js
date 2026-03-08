import { pageLayout } from '../templates/layout.js';
import { login } from '../lib/api.js';

export function loginPage() {
  setTimeout(() => {
    const form = document.getElementById('login-form');
    if (!form) {
      return;
    }

    form.addEventListener('submit', async (event) => {
      event.preventDefault();

      const formData = new FormData(form);

      await login({
        email: formData.get('email'),
        password: formData.get('password'),
      });

      window.location.href = '/';
    });
  });

  return pageLayout({
    title: 'Login',
    description: 'Страница входа пользователя.',
    content: `
      <form id="login-form">
        <input name="email" type="email" placeholder="Email" />
        <input name="password" type="password" placeholder="Password" />
        <button type="submit">Login</button>
      </form>
    `,
  });
}
