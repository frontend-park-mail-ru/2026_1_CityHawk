
import { register } from '../../../api/auth.api.js';
import { renderTemplate } from '../../../app/templates/renderer.js';
import { attachPasswordToggles } from '../shared/password-toggle.js';
import {
  getErrorMessageElement,
  hideFieldError,
  hideFieldMessage,
  showFieldError,
  showFieldMessage,
} from '../shared/field-messages.js';
import { checkPasswordStrength, isValidEmail } from '../shared/validators.js';
import { attachOAuthButtons } from '../oauth.js';

interface RegisterState extends Record<string, unknown> {
  step?: number;
  name?: string;
  surname?: string;
  email?: string;
  password?: string;
}

interface RegisterFormOptions {
  state?: RegisterState;
  rerender?: () => void;
  onFinish?: () => void;
}

export function renderRegisterStep(state: RegisterState = {}): string {
  return renderTemplate(getStepTemplate(state.step || 1), state);
}

export function attachRegisterForm(root: ParentNode, options: RegisterFormOptions = {}): void {
  const state = options.state || {};

  attachPasswordToggles(root);
  attachOAuthButtons(root);
  animateLoginTickets(root, state);

  if (state.step === 1) {
    setupStep1(root, state, options.rerender);
  }

  if (state.step === 2) {
    setupStep2(root, state, options.rerender);
  }

  if (state.step === 3) {
    setupStep3(root, options);
  }
}

function getStepTemplate(step: number): string {
  switch (step) {
    case 1: return 'register-form-step1';
    case 2: return 'register-form-step2';
    case 3: return 'register-form-step3';
    default: return 'register-form-step1';
  }
}

function animateLoginTickets(root: ParentNode, state: RegisterState): void {
  const loginEl = root instanceof Element && root.classList.contains('login')
    ? root
    : root.querySelector('.login');

  if (!(loginEl instanceof HTMLElement)) return;

  if (state.step === 1) {
    loginEl.classList.remove('loaded');

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        if (state.step === 1) {
          loginEl.classList.add('loaded');
        }
      });
    });
    return;
  }

  loginEl.classList.add('loaded');
}

function setupStep1(root: ParentNode, state: RegisterState, rerender?: () => void): void {
  const nameInput = root.querySelector('#name');
  const surnameInput = root.querySelector('#surname');
  const submitBtn = root.querySelector('.login__submit');

  if (!(nameInput instanceof HTMLInputElement)
    || !(surnameInput instanceof HTMLInputElement)
    || !(submitBtn instanceof HTMLButtonElement)) {
    return;
  }

  let nameError = false;
  let surnameError = false;

  nameInput.value = state.name || '';
  surnameInput.value = state.surname || '';

  nameInput.addEventListener('input', function handleNameInput(this: HTMLInputElement) {
    if (!nameError) return;
    const wrapper = this.closest('.login__field-error-wrapper');

    if (!this.value.trim()) {
      showFieldError(wrapper, 'Имя не должно быть пустым');
    } else {
      hideFieldError(wrapper);
      nameError = false;
    }
  });

  surnameInput.addEventListener('input', function handleSurnameInput(this: HTMLInputElement) {
    if (!surnameError) return;
    const wrapper = this.closest('.login__field-error-wrapper');

    if (!this.value.trim()) {
      showFieldError(wrapper, 'Фамилия не должна быть пустой');
    } else {
      hideFieldError(wrapper);
      surnameError = false;
    }
  });

  submitBtn.addEventListener('click', (event) => {
    event.preventDefault();

    const nameWrapper = nameInput.closest('.login__field-error-wrapper');
    const surnameWrapper = surnameInput.closest('.login__field-error-wrapper');

    nameError = false;
    surnameError = false;

    if (!nameInput.value.trim()) {
      showFieldError(nameWrapper, 'Имя не должно быть пустым');
      nameError = true;
    } else {
      hideFieldError(nameWrapper);
    }

    if (!surnameInput.value.trim()) {
      showFieldError(surnameWrapper, 'Фамилия не должна быть пустой');
      surnameError = true;
    } else {
      hideFieldError(surnameWrapper);
    }

    if (nameError || surnameError) {
      return;
    }

    state.name = nameInput.value.trim();
    state.surname = surnameInput.value.trim();
    state.step = 2;
    rerender?.();
  });
}

function setupStep2(root: ParentNode, state: RegisterState, rerender?: () => void): void {
  const emailInput = root.querySelector('#email');
  const passwordInput = root.querySelector('#password');
  const confirmInput = root.querySelector('#password-confirm');
  const nextBtn = root.querySelector('.login__next');
  const prevBtn = root.querySelector('.login__prev');

  if (!(emailInput instanceof HTMLInputElement)
    || !(passwordInput instanceof HTMLInputElement)
    || !(confirmInput instanceof HTMLInputElement)
    || !(nextBtn instanceof HTMLButtonElement)
    || !(prevBtn instanceof HTMLButtonElement)) {
    return;
  }

  const safeEmailInput: HTMLInputElement = emailInput;
  const safePasswordInput: HTMLInputElement = passwordInput;
  const safeConfirmInput: HTMLInputElement = confirmInput;
  const safeNextBtn: HTMLButtonElement = nextBtn;
  const safePrevBtn: HTMLButtonElement = prevBtn;

  let emailError = false;
  let passError = false;
  let confirmError = false;
  let submitAttempted = false;

  safeEmailInput.value = state.email || '';

  function validateEmail(): void {
    const wrapper = safeEmailInput.closest('.login__field-error-wrapper');
    const value = safeEmailInput.value.trim();

    if (!submitAttempted && !emailError) return;

    if (!value) {
      showFieldMessage(wrapper, 'Поле email не должно быть пустым!', 'var(--color-mid)', true);
      emailError = true;
    } else if (!isValidEmail(value)) {
      showFieldMessage(wrapper, 'Введите email в формате address@service.com!', 'var(--color-mid)', true);
      emailError = true;
    } else {
      hideFieldMessage(wrapper);
      emailError = false;
    }
  }

  function updatePasswordField(): void {
    const wrapper = safePasswordInput.closest('.login__field-error-wrapper');
    const pass = safePasswordInput.value.trim();
    const result = checkPasswordStrength(pass);
    let showText = true;

    if (!result.isError && submitAttempted && (emailError || confirmError)) {
      showText = false;
    }

    const showBorder = result.isError && (submitAttempted || passError);

    if (showText) {
      showFieldMessage(wrapper, result.msg, result.color, result.isError ? showBorder : false);
    } else {
      const errorMsg = getErrorMessageElement(wrapper);

      if (errorMsg) {
        errorMsg.textContent = '';
        errorMsg.style.color = '';
      }

      wrapper?.classList.toggle('login__field-error-wrapper--error', showBorder);
    }

    passError = result.isError && (submitAttempted || passError);
  }

  function updateConfirmField(): void {
    const wrapper = safeConfirmInput.closest('.login__field-error-wrapper');
    const pass = safePasswordInput.value.trim();
    const confirm = safeConfirmInput.value.trim();

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
      showFieldMessage(wrapper, msg, color, showBorder);
    } else {
      hideFieldMessage(wrapper);
    }

    confirmError = isError && (submitAttempted || confirmError);
  }

  safeEmailInput.addEventListener('input', validateEmail);
  safePasswordInput.addEventListener('input', updatePasswordField);
  safePasswordInput.addEventListener('focus', updatePasswordField);
  safePasswordInput.addEventListener('blur', () => {
    const wrapper = safePasswordInput.closest('.login__field-error-wrapper');
    const result = checkPasswordStrength(safePasswordInput.value.trim());

    if (!result.isError) {
      hideFieldMessage(wrapper);
    }
  });

  safeConfirmInput.addEventListener('input', updateConfirmField);
  safeConfirmInput.addEventListener('focus', updateConfirmField);
  safeConfirmInput.addEventListener('blur', () => {
    const wrapper = safeConfirmInput.closest('.login__field-error-wrapper');

    if (!confirmError) {
      hideFieldMessage(wrapper);
    }
  });

  safePrevBtn.addEventListener('click', (event) => {
    event.preventDefault();
    state.email = safeEmailInput.value;
    state.step = 1;
    rerender?.();
  });

  safeNextBtn.addEventListener('click', async (event) => {
    event.preventDefault();

    submitAttempted = true;
    validateEmail();
    updatePasswordField();
    updateConfirmField();

    if (emailError || passError || confirmError) {
      return;
    }

    state.email = safeEmailInput.value.trim();
    state.password = safePasswordInput.value.trim();

    try {
      await register({
        username: state.name || '',
        email: state.email,
        userSurname: state.surname || '',
        password: state.password,
      });

      state.step = 3;
      rerender?.();
    } catch {
      const wrapper = safeEmailInput.closest('.login__field-error-wrapper');
      showFieldMessage(wrapper, 'Пользователь уже существует', 'var(--color-mid)', true);
    }
  });
}

function setupStep3(root: ParentNode, options: RegisterFormOptions): void {
  const finishBtn = root.querySelector('.js-go-home');

  if (!(finishBtn instanceof HTMLButtonElement)) {
    return;
  }

  finishBtn.addEventListener('click', (event) => {
    event.preventDefault();
    options.onFinish?.();
  });
}
