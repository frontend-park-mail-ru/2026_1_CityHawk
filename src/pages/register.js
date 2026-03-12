import { register } from '../lib/api.js';
import { attachPasswordToggles } from '../lib/password-toggle.js';
import { renderTemplate } from '../templates/renderer.js';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function animateLoginTickets(root, state) {
  if (!root) return;

  const loginEl = root.classList.contains('login')
    ? root
    : root.querySelector('.login');
  if (!loginEl) return;

  if (state.step === 1) {
    // remove class so we start from initial state (useful when coming back)
    loginEl.classList.remove('loaded');

    // schedule addition on next frame; double rAF helps ensure browser
    // has applied the removed state before we add it, triggering the CSS
    // transition. using a timeout caused problems when user clicked fast.
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        if (state.step === 1) {
          loginEl.classList.add('loaded');
        }
      });
    });
    return;
  }

  // on steps 2+ we want tickets already in final position and **no
  // animation**, so just keep the class present (adding it if missing
  // does not trigger a transition because the element is not
  // transitioning at that moment).
  loginEl.classList.add('loaded');
}

/* ================= STEP 1 ================= */

function setupStep1(root, state, rerender) {

  const nameInput = root.querySelector('#name');
  const surnameInput = root.querySelector('#surname');
  const submitBtn = root.querySelector('.login__submit');

  let nameError = false;
  let surnameError = false;

  function showError(wrapper, msg) {
    wrapper.classList.add('login__field-error-wrapper--error');
    const err = wrapper.querySelector('.login__error-message');
    if (err) err.textContent = msg;
  }

  function hideError(wrapper) {
    wrapper.classList.remove('login__field-error-wrapper--error');
    const err = wrapper.querySelector('.login__error-message');
    if (err) err.textContent = '';
  }

  nameInput.value = state.name || '';
  surnameInput.value = state.surname || '';

  nameInput.addEventListener('input', function () {

    if (!nameError) return;

    const wrapper = this.closest('.login__field-error-wrapper');

    if (!this.value.trim()) {
      showError(wrapper, 'Имя не должно быть пустым');
    } else {
      hideError(wrapper);
      nameError = false;
    }

  });

  surnameInput.addEventListener('input', function () {

    if (!surnameError) return;

    const wrapper = this.closest('.login__field-error-wrapper');

    if (!this.value.trim()) {
      showError(wrapper, 'Фамилия не должна быть пустой');
    } else {
      hideError(wrapper);
      surnameError = false;
    }

  });

  submitBtn.addEventListener('click', function (e) {

    e.preventDefault();

    const nameWrapper = nameInput.closest('.login__field-error-wrapper');
    const surnameWrapper = surnameInput.closest('.login__field-error-wrapper');

    nameError = false;
    surnameError = false;

    if (!nameInput.value.trim()) {
      showError(nameWrapper, 'Имя не должно быть пустым');
      nameError = true;
    } else {
      hideError(nameWrapper);
    }

    if (!surnameInput.value.trim()) {
      showError(surnameWrapper, 'Фамилия не должна быть пустой');
      surnameError = true;
    } else {
      hideError(surnameWrapper);
    }

    if (nameError || surnameError) return;

    state.name = nameInput.value.trim();
    state.surname = surnameInput.value.trim();

    state.step = 2;

    rerender();

  });

}

/* ================= STEP 2 ================= */

function setupStep2(root, state, rerender) {

  const emailInput = root.querySelector('#email');
  const passwordInput = root.querySelector('#password');
  const confirmInput = root.querySelector('#password-confirm');

  const nextBtn = root.querySelector('.login__next');
  const prevBtn = root.querySelector('.login__prev');

  let emailError = false;
  let passError = false;
  let confirmError = false;
  let submitAttempted = false;

  emailInput.value = state.email || '';

  function showMessage(wrapper, msg, color, showBorder = true) {

    const errorMsg = wrapper.querySelector('.login__error-message');

    if (errorMsg) {
      errorMsg.textContent = msg;
      errorMsg.style.color = color || 'var(--color-mid)';
    }

    if (showBorder) {
      wrapper.classList.add('login__field-error-wrapper--error');
    } else {
      wrapper.classList.remove('login__field-error-wrapper--error');
    }

  }

  function hideMessage(wrapper) {

    const errorMsg = wrapper.querySelector('.login__error-message');

    if (errorMsg) errorMsg.textContent = '';

    wrapper.classList.remove('login__field-error-wrapper--error');

  }

  function checkPasswordStrength(pass) {

    if (!pass)
      return { msg: 'Пароль не должен быть пустым!', color: 'var(--color-mid)', isError: true };

    if (pass.length < 8)
      return { msg: 'Пароль должен содержать не менее 8 символов!', color: 'var(--color-mid)', isError: true };

    if (!/[a-z]/.test(pass) || !/[A-Z]/.test(pass))
      return { msg: 'Пароль должен содержать буквы в разном регистре!', color: 'orange', isError: true };

    if (!/[!@#$%^&*]/.test(pass))
      return { msg: 'Пароль должен содержать спецсимволы!', color: 'gold', isError: true };

    return { msg: 'Ваш пароль достаточно надежный!', color: 'green', isError: false };

  }

  function validateEmail() {

    const wrapper = emailInput.closest('.login__field-error-wrapper');
    const value = emailInput.value.trim();

    if (!submitAttempted && !emailError) return;

    if (!value) {

      showMessage(wrapper, 'Поле email не должно быть пустым!', 'var(--color-mid)', true);
      emailError = true;

    } else if (!EMAIL_PATTERN.test(value)) {

      showMessage(wrapper, 'Введите email в формате address@service.com!', 'var(--color-mid)', true);
      emailError = true;

    } else {

      hideMessage(wrapper);
      emailError = false;

    }

  }

  emailInput.addEventListener('input', validateEmail);

  function updatePasswordField() {

    const wrapper = passwordInput.closest('.login__field-error-wrapper');
    const pass = passwordInput.value.trim();
    const result = checkPasswordStrength(pass);

    let showText = true;

    if (!result.isError && submitAttempted && (emailError || confirmError)) {
      showText = false;
    }

    const showBorder = result.isError && (submitAttempted || passError);

    if (showText) {

      showMessage(wrapper, result.msg, result.color, result.isError ? showBorder : false);

    } else {

      const errorMsg = wrapper.querySelector('.login__error-message');

      if (errorMsg) errorMsg.textContent = '';

      wrapper.classList.toggle('login__field-error-wrapper--error', showBorder);

    }

    passError = result.isError && (submitAttempted || passError);

  }

  passwordInput.addEventListener('input', updatePasswordField);
  passwordInput.addEventListener('focus', updatePasswordField);

  passwordInput.addEventListener('blur', () => {

    const wrapper = passwordInput.closest('.login__field-error-wrapper');
    const pass = passwordInput.value.trim();
    const result = checkPasswordStrength(pass);

    if (!result.isError) hideMessage(wrapper);

  });

  function updateConfirmField() {

    const wrapper = confirmInput.closest('.login__field-error-wrapper');
    const pass = passwordInput.value.trim();
    const confirm = confirmInput.value.trim();

    let isError = false;
    let msg = '';
    let color = '';

    if (!confirm) {

      msg = 'Пароль не должен быть пустым!';
      color = 'var(--color-mid)';
      isError = true;

    } else if (confirm !== pass) {

      msg = 'Пароли должны совпадать!';
      color = 'var(--color-mid)';
      isError = true;

    }

    const showBorder = isError && (submitAttempted || confirmError);

    if (isError) {

      showMessage(wrapper, msg, color, showBorder);

    } else {

      hideMessage(wrapper);

    }

    confirmError = isError && (submitAttempted || confirmError);

  }

  confirmInput.addEventListener('input', updateConfirmField);
  confirmInput.addEventListener('focus', updateConfirmField);

  confirmInput.addEventListener('blur', () => {

    const wrapper = confirmInput.closest('.login__field-error-wrapper');

    if (!confirmError) hideMessage(wrapper);

  });

  prevBtn.addEventListener('click', function (e) {

    e.preventDefault();

    state.email = emailInput.value;

    state.step = 1;

    rerender();

  });

  nextBtn.addEventListener('click', async function (e) {

    e.preventDefault();

    submitAttempted = true;

    validateEmail();
    updatePasswordField();
    updateConfirmField();

    if (emailError || passError || confirmError) return;

    state.email = emailInput.value.trim();
    state.password = passwordInput.value.trim();

    try {

      await register({
        username: state.name,
        email: state.email,
        password: state.password
      });

      state.step = 3;

      rerender();

    } catch (error) {

      const wrapper = emailInput.closest('.login__field-error-wrapper');

      showMessage(wrapper, 'Пользователь уже существует', 'var(--color-mid)', true);

    }

  });

}

/* ================= VIEW ================= */

function getStepTemplate(step) {

  switch (step) {
    case 1: return 'register-form-step1';
    case 2: return 'register-form-step2';
    case 3: return 'register-form-step3';
    default: return 'register-form-step1';
  }

}

function mountRegister(root, state, rerender) {
  attachPasswordToggles(root);

  // animation always evaluated because it handles other steps itself
  animateLoginTickets(root, state);

  if (state.step === 1) {
    setupStep1(root, state, rerender);
  }

  if (state.step === 2) {
    setupStep2(root, state, rerender);
  }
}

function createRegisterView(state = {}) {

  state.step = state.step || 1;

  const html = `
    <main class="login">
      ${renderTemplate('login-aside')}
      ${renderTemplate(getStepTemplate(state.step), state)}
    </main>
  `;

  return {

    html,

    mount(root) {

      root.innerHTML = this.html;

      const rerender = () => {

        const view = createRegisterView(state);

        view.mount(root);

      };

      mountRegister(root, state, rerender);

    }

  };

}

export function registerPage() {
  return createRegisterView();
}
