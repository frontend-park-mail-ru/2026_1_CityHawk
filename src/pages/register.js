import { register } from '../lib/api.js';
import { attachPasswordToggles } from '../lib/password-toggle.js';
import { renderTemplate } from '../templates/renderer.js';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

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
  form?.querySelector('.login__form-error')?.remove();
}

function createRegisterView(state = {}) {
  return {
    html: renderTemplate('register', state),
    mount(root) {
      attachPasswordToggles(root);

      const form = root.querySelector('#register-form');
      if (!form) {
        return;
      }

      const nameInput = root.querySelector('#name');
      const emailInput = root.querySelector('#register-email');
      const passwordInput = root.querySelector('#register-password');
      const passwordRepeatInput = root.querySelector('#register-password-repeat');
      const nameField = nameInput?.closest('.login__field');
      const emailField = emailInput?.closest('.login__field');
      const passwordField = passwordInput?.closest('.login__field');
      const passwordRepeatField = passwordRepeatInput?.closest('.login__field');

      nameInput?.addEventListener('input', () => {
        clearFormError(form);

        if (!nameInput.classList.contains('is-error')) {
          return;
        }

        if (!nameInput.value.trim()) {
          setFieldError(nameField, 'Имя не должно быть пустым.');
          return;
        }

        clearFieldError(nameField);
      });

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

        if (passwordInput.classList.contains('is-error')) {
          if (!passwordInput.value) {
            setFieldError(passwordField, 'Пароль не должен быть пустым.');
          } else {
            clearFieldError(passwordField);
          }
        }

        if (passwordRepeatInput?.classList.contains('is-error')) {
          if (!passwordRepeatInput.value) {
            setFieldError(passwordRepeatField, 'Повторите пароль.');
          } else if (passwordRepeatInput.value !== passwordInput.value) {
            setFieldError(passwordRepeatField, 'Пароли не совпадают.');
          } else {
            clearFieldError(passwordRepeatField);
          }
        }
      });

      passwordRepeatInput?.addEventListener('input', () => {
        clearFormError(form);

        if (!passwordRepeatInput.classList.contains('is-error')) {
          return;
        }

        if (!passwordRepeatInput.value) {
          setFieldError(passwordRepeatField, 'Повторите пароль.');
          return;
        }

        if (passwordRepeatInput.value !== passwordInput?.value) {
          setFieldError(passwordRepeatField, 'Пароли не совпадают.');
          return;
        }

        clearFieldError(passwordRepeatField);
      });

      form.addEventListener('submit', async (event) => {
        event.preventDefault();

        const formData = new FormData(form);
        const name = String(formData.get('name') || '').trim();
        const email = String(formData.get('email') || '').trim();
        const password = String(formData.get('password') || '');
        const passwordRepeat = String(formData.get('passwordRepeat') || '');

        const nextState = {
          name,
          email,
          nameError: '',
          emailError: '',
          passwordError: '',
          passwordRepeatError: '',
          formError: '',
        };

        if (!name) {
          nextState.nameError = 'Имя не должно быть пустым.';
        }

        if (!email) {
          nextState.emailError = 'Поле email не должно быть пустым.';
        } else if (!EMAIL_PATTERN.test(email)) {
          nextState.emailError = 'Введите email в формате address@service.com.';
        }

        if (!password) {
          nextState.passwordError = 'Пароль не должен быть пустым.';
        }

        if (!passwordRepeat) {
          nextState.passwordRepeatError = 'Повторите пароль.';
        } else if (password !== passwordRepeat) {
          nextState.passwordRepeatError = 'Пароли не совпадают.';
        }

        if (
          nextState.nameError ||
          nextState.emailError ||
          nextState.passwordError ||
          nextState.passwordRepeatError
        ) {
          const nextView = createRegisterView(nextState);
          root.innerHTML = nextView.html;
          nextView.mount(root);
          return;
        }

        try {
          await register({ email, password });
        } catch (error) {
          const nextView = createRegisterView({
            ...nextState,
            formError: error.message || 'Не удалось выполнить регистрацию.',
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

export function registerPage() {
  return createRegisterView();
}
