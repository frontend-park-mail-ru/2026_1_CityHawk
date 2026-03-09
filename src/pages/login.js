import { login } from '../lib/api.js';
import { renderTemplate } from '../templates/renderer.js';

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

      window.history.pushState(null, '', '/');
      window.dispatchEvent(new PopStateEvent('popstate'));
    });
  });

  return renderTemplate('login');
}
