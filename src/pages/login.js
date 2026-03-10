import { login } from '../lib/api.js';
import { attachPasswordToggles } from '../lib/password-toggle.js';
import { renderTemplate } from '../templates/renderer.js';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function getLoginErrorMessage(error) {
  if (error?.status === 401) {
    return 'Неверный email или пароль.';
  }

  if (error?.status === 400) {
    return 'Проверьте корректность email и пароля.';
  }

  return 'Не удалось выполнить вход.';
}

function setFieldError(field, message) {
  if (!field) {
    return;
  }

  const wrapper = field.querySelector('.login__input-wrapper');
  const input = field.querySelector('input');
  if (!wrapper || !input) {
    return;
  }

  input.classList.add('is-error');

  let errorNode = wrapper.querySelector('.login__error-message');
  if (!errorNode) {
    errorNode = document.createElement('p');
    errorNode.className = 'login__error-message';
    wrapper.append(errorNode);
  }

  errorNode.textContent = message;
}

function clearFieldError(field) {
  if (!field) {
    return;
  }

  const input = field.querySelector('input');
  const errorNode = field.querySelector('.login__error-message');

  input?.classList.remove('is-error');
  errorNode?.remove();
}

function clearFormError(form) {
  form?.querySelector('.login__error-message--form')?.remove();
}

function createLoginView(state = {}) {
  return {
    html: renderTemplate('login', state),
    mount(root) {
      attachPasswordToggles(root);

      const form = root.querySelector('#login-form');
      if (!form) {
        return;
      }

      const emailField = root.querySelector('.login__email');
      const passwordField = root.querySelector('.login__password');
      const emailInput = root.querySelector('#email');
      const passwordInput = root.querySelector('#password');

      emailInput?.addEventListener('input', () => {
        clearFormError(form);

        if (!emailInput.classList.contains('is-error')) {
          return;
        }

        const email = emailInput.value.trim();
        if (!email) {
          setFieldError(emailField, 'Поле email не должно быть пустым.');
          return;
        }

        if (!EMAIL_PATTERN.test(email)) {
          setFieldError(emailField, 'Введите email в формате address@service.com.');
          return;
        }

        clearFieldError(emailField);
      });

      passwordInput?.addEventListener('input', () => {
        clearFormError(form);

        if (!passwordInput.classList.contains('is-error')) {
          return;
        }

        if (!passwordInput.value) {
          setFieldError(passwordField, 'Пароль не должен быть пустым.');
          return;
        }

        clearFieldError(passwordField);
      });

      form.addEventListener('submit', async (event) => {
        event.preventDefault();

        const formData = new FormData(form);
        const email = String(formData.get('email') || '').trim();
        const password = String(formData.get('password') || '');

        const nextState = {
          email,
          emailError: '',
          passwordError: '',
          formError: '',
        };

        if (!email) {
          nextState.emailError = 'Поле email не должно быть пустым.';
        } else if (!EMAIL_PATTERN.test(email)) {
          nextState.emailError = 'Введите email в формате address@service.com.';
        }

        if (!password) {
          nextState.passwordError = 'Пароль не должен быть пустым.';
        }

        if (nextState.emailError || nextState.passwordError) {
          const nextView = createLoginView(nextState);
          root.innerHTML = nextView.html;
          nextView.mount(root);
          return;
        }

        try {
          await login({ email, password });
        } catch (error) {
          const nextView = createLoginView({
            ...nextState,
            formError: getLoginErrorMessage(error),
          });
          root.innerHTML = nextView.html;
          nextView.mount(root);
          return;
        }

        window.history.pushState(null, '', '/');
        window.dispatchEvent(new PopStateEvent('popstate'));
      });
    },
  };
}

export function loginPage() {
  return createLoginView();
}
