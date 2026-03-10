import { login } from '../lib/api.js';
import { attachPasswordToggles } from '../lib/password-toggle.js';
import { renderTemplate } from '../templates/renderer.js';

function animateLoginTickets(root) {
  if (!root) return;
  const loginEl = root.classList.contains('login') ? root : root.querySelector('.login');
  if (!loginEl) return;
  setTimeout(() => loginEl.classList.add('loaded'), 100);
}

function setupValidation(root) {
  const submitBtn = root.querySelector('.login__submit');
  const emailInput = root.querySelector('#email');
  const passwordInput = root.querySelector('#password');

  let emailError = false;
  let passError = false;

  function showError(fieldWrapper, msg) {
    fieldWrapper.classList.add('login__field-error-wrapper--error');
    const errorMsg = fieldWrapper.querySelector('.login__error-message');
    if (errorMsg) errorMsg.textContent = msg;
  }

  function hideError(fieldWrapper) {
    fieldWrapper.classList.remove('login__field-error-wrapper--error');
    const errorMsg = fieldWrapper.querySelector('.login__error-message');
    if (errorMsg) errorMsg.textContent = '';
  }

  emailInput.addEventListener('input', function () {
    if (!emailError) return;
    const wrapper = this.closest('.login__field-error-wrapper');
    const val = this.value.trim();
    if (!val) {
      showError(wrapper, 'Поле email не должно быть пустым!');
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val)) {
      showError(wrapper, 'Введите email в формате address@service.com!');
    } else {
      hideError(wrapper);
      emailError = false;
    }
  });

  passwordInput.addEventListener('input', function () {
    if (!passError) return;
    const wrapper = this.closest('.login__field-error-wrapper');
    const val = this.value.trim();
    if (!val) {
      showError(wrapper, 'Пароль не должен быть пустым!');
    } else {
      hideError(wrapper);
      passError = false;
    }
  });

  submitBtn.addEventListener('click', async function (e) {
    e.preventDefault();

    const emailWrapper = emailInput.closest('.login__field-error-wrapper');
    const passWrapper = passwordInput.closest('.login__field-error-wrapper');

    emailError = false;
    passError = false;

    const emailVal = emailInput.value.trim();
    const passVal = passwordInput.value.trim();

    if (!emailVal) {
      showError(emailWrapper, 'Поле email не должно быть пустым!');
      emailError = true;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailVal)) {
      showError(emailWrapper, 'Введите email в формате address@service.com!');
      emailError = true;
    } else {
      hideError(emailWrapper);
    }

    if (!passVal) {
      showError(passWrapper, 'Пароль не должен быть пустым!');
      passError = true;
    } else {
      hideError(passWrapper);
    }

    if (emailError || passError) return;

    // ===== Отправка на сервер =====
    try {
      await login({ email: emailVal, password: passVal });
      window.history.pushState(null, '', '/');
      window.dispatchEvent(new PopStateEvent('popstate'));
    } catch (error) {
      // Если сервер вернул ошибку — подсветим оба поля и покажем сообщение
      const emailWrapper = emailInput.closest('.login__field-error-wrapper');
      const passWrapper = passwordInput.closest('.login__field-error-wrapper');

      // Подсветка обоих полей
      emailWrapper.classList.add('login__field-error-wrapper--error');
      passWrapper.classList.add('login__field-error-wrapper--error');

      // Сообщение только под email
      const emailErrorMsg = emailWrapper.querySelector('.login__error-message');
      if (emailErrorMsg) emailErrorMsg.textContent = 'Пользователь не найден';

      // Очистим ошибку под паролем (или оставим пустой)
      const passErrorMsg = passWrapper.querySelector('.login__error-message');
      if (passErrorMsg) passErrorMsg.textContent = '';
    }
  });
}

function mountLogin(root) {
  attachPasswordToggles(root);
  animateLoginTickets(root);
  setupValidation(root);
}

function createLoginView(state = {}) {
  return {
    html: renderTemplate('login', state),
    mount(root) {
      root.innerHTML = this.html; // вставляем HTML
      mountLogin(root);            // монтируем обработку ошибок + анимацию
    },
  };
}

export function loginPage() {
  return createLoginView();
}
