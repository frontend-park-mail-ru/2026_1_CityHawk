import { register } from '../lib/api.js';
import { renderTemplate } from '../templates/renderer.js';

export function registerPage() {
  setTimeout(() => {
    const form = document.getElementById('register-form');
    if (!form) {
      return;
    }

    form.addEventListener('submit', async (event) => {
      event.preventDefault();

      const formData = new FormData(form);
      const email = String(formData.get('email') || '').trim();
      const password = String(formData.get('password') || '');
      const passwordRepeat = String(formData.get('passwordRepeat') || '');

      if (!email || !password) {
        window.alert('Email и пароль обязательны.');
        return;
      }

      if (password !== passwordRepeat) {
        window.alert('Пароли не совпадают.');
        return;
      }

      await register({
        email,
        password,
      });

      window.history.pushState(null, '', '/');
      window.dispatchEvent(new PopStateEvent('popstate'));
    });
  });

  return renderTemplate('register');
}
