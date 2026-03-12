import { login } from '../lib/api.js';
import { attachPasswordToggles } from '../lib/password-toggle.js';
import { renderTemplate } from '../templates/renderer.js';

/**
 * Запускает анимацию появления билетов на экране входа после монтирования.
 *
 * @param {ParentNode | null | undefined} root Корневой узел страницы.
 * @returns {void}
 */
function animateLoginTickets(root) {
  if (!root) return;
  const loginEl = root.classList.contains('login') ? root : root.querySelector('.login');
  if (!loginEl) return;
  setTimeout(() => loginEl.classList.add('loaded'), 100);
}

/**
 * Подключает клиентскую валидацию и обработку отправки формы входа.
 *
 * @param {ParentNode} root Корневой узел страницы.
 * @returns {void}
 */
function setupValidation(root) {
  const submitBtn = root.querySelector('.login__submit');
  const emailInput = root.querySelector('#email');
  const passwordInput = root.querySelector('#password');

  let emailError = false;
  let passError = false;

  /**
   * Показывает ошибку валидации у поля.
   *
   * @param {Element} fieldWrapper Обёртка поля.
   * @param {string} msg Текст ошибки.
   * @returns {void}
   */
  function showError(fieldWrapper, msg) {
    fieldWrapper.classList.add('login__field-error-wrapper--error');
    const errorMsg = fieldWrapper.querySelector('.login__error-message');
    if (errorMsg) errorMsg.textContent = msg;
  }

  /**
   * Скрывает ошибку валидации у поля.
   *
   * @param {Element} fieldWrapper Обёртка поля.
   * @returns {void}
   */
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

    try {
      await login({ email: emailVal, password: passVal });
      window.history.pushState(null, '', '/');
      window.dispatchEvent(new PopStateEvent('popstate'));
    } catch {
      const emailWrapper = emailInput.closest('.login__field-error-wrapper');
      const passWrapper = passwordInput.closest('.login__field-error-wrapper');

      emailWrapper.classList.add('login__field-error-wrapper--error');
      passWrapper.classList.add('login__field-error-wrapper--error');

      const emailErrorMsg = emailWrapper.querySelector('.login__error-message');
      if (emailErrorMsg) emailErrorMsg.textContent = 'Пользователь не найден';

      const passErrorMsg = passWrapper.querySelector('.login__error-message');
      if (passErrorMsg) passErrorMsg.textContent = '';
    }
  });
}

/**
 * Инициализирует всё поведение страницы входа для уже смонтированного DOM.
 *
 * @param {HTMLElement} root Корневой элемент страницы.
 * @returns {void}
 */
function mountLogin(root) {
  attachPasswordToggles(root);
  animateLoginTickets(root);
  setupValidation(root);
}

/**
 * Создаёт объект представления для страницы входа.
 *
 * @param {Record<string, any>} [state] Состояние страницы.
 * @returns {{ html: string, mount(root: HTMLElement): void }}
 */
function createLoginView(state = {}) {
  return {
    html: renderTemplate('login', state),
    mount(root) {
      root.innerHTML = this.html;
      mountLogin(root);
    },
  };
}

/**
 * Возвращает представление страницы входа.
 *
 * @returns {{ html: string, mount(root: HTMLElement): void }}
 */
export function loginPage() {
  return createLoginView();
}
