
import { register } from '../../../api/auth.api.js';
import { renderTemplate } from '../../../app/templates/renderer.js';
import type { ApiError } from '../../../types/api.js';
import { attachPasswordToggles } from '../shared/password-toggle.js';
import {
  getErrorMessageElement,
  hideFieldMessage,
  showFieldMessage,
} from '../shared/field-messages.js';
import {
  checkPasswordStrength,
  getEmailValidationError,
  validatePersonName,
} from '../shared/validators.js';
import { attachOAuthButtons } from '../oauth.js';

interface RegisterState {
  step?: number;
  username?: string;
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

export function attachRegisterForm(root: ParentNode, options: RegisterFormOptions = {}): () => void {
  const state = options.state || {};

  const detachPasswordToggles = attachPasswordToggles(root);
  const detachOAuthButtons = attachOAuthButtons(root);
  animateLoginTickets(root, state);

  let detachStep: (() => void) | null = null;

  if (state.step === 1) {
    detachStep = setupRegisterCredentials(root, state, options.onFinish);
  }

  return () => {
    detachStep?.();
    detachPasswordToggles();
    detachOAuthButtons();
  };
}

function getStepTemplate(step: number): string {
  switch (step) {
    case 1: return 'register-step1';
    default: return 'register-step1';
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

function setupRegisterCredentials(
  root: ParentNode,
  state: RegisterState,
  onFinish?: () => void,
): () => void {
  const emailInput = root.querySelector('#email');
  const usernameInput = root.querySelector('#username');
  const passwordInput = root.querySelector('#password');
  const confirmInput = root.querySelector('#password-confirm');
  const submitBtn = root.querySelector('[data-role="register-finish"]') || root.querySelector('.login__submit');

  if (!(usernameInput instanceof HTMLInputElement)
    || !(emailInput instanceof HTMLInputElement)
    || !(passwordInput instanceof HTMLInputElement)
    || !(confirmInput instanceof HTMLInputElement)
    || !(submitBtn instanceof HTMLButtonElement)) {
    return () => {};
  }

  const safeUsernameInput: HTMLInputElement = usernameInput;
  const safeEmailInput: HTMLInputElement = emailInput;
  const safePasswordInput: HTMLInputElement = passwordInput;
  const safeConfirmInput: HTMLInputElement = confirmInput;
  const safeSubmitBtn: HTMLButtonElement = submitBtn;

  let usernameError = false;
  let emailError = false;
  let passError = false;
  let confirmError = false;
  let submitAttempted = false;

  safeUsernameInput.value = state.username || '';
  safeEmailInput.value = state.email || '';

  function validateUsername(): void {
    const wrapper = safeUsernameInput.closest('.login__field-error-wrapper');
    const value = safeUsernameInput.value;

    if (!submitAttempted && !usernameError) return;

    const validationError = validatePersonName(value, 'Имя');
    if (validationError) {
      showFieldMessage(wrapper, validationError, 'var(--color-mid)', true);
      usernameError = true;
    } else {
      hideFieldMessage(wrapper);
      usernameError = false;
    }
  }

  function validateEmail(): void {
    const wrapper = safeEmailInput.closest('.login__field-error-wrapper');
    const value = safeEmailInput.value;

    if (!submitAttempted && !emailError) return;

    const validationError = getEmailValidationError(value);
    if (validationError) {
      showFieldMessage(wrapper, validationError, 'var(--color-mid)', true);
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

    if (!result.isError && submitAttempted && (usernameError || emailError || confirmError)) {
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
      msg = 'Повторите пароль';
      color = 'var(--color-mid)';
      isError = true;
    } else if (confirm !== pass) {
      msg = 'Пароли не совпадают';
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

  const handlePasswordBlur = (): void => {
    const wrapper = safePasswordInput.closest('.login__field-error-wrapper');
    const result = checkPasswordStrength(safePasswordInput.value.trim());

    if (!result.isError) {
      hideFieldMessage(wrapper);
    }
  };

  const handleConfirmBlur = (): void => {
    const wrapper = safeConfirmInput.closest('.login__field-error-wrapper');

    if (!confirmError) {
      hideFieldMessage(wrapper);
    }
  };

  const handleSubmitClick = async (event: Event): Promise<void> => {
    event.preventDefault();

    submitAttempted = true;
    validateUsername();
    validateEmail();
    updatePasswordField();
    updateConfirmField();

    if (usernameError || emailError || passError || confirmError) {
      return;
    }

    state.username = safeUsernameInput.value.trim();
    state.email = safeEmailInput.value.trim();
    state.password = safePasswordInput.value.trim();

    try {
      await register({
        username: state.username,
        email: state.email,
        password: state.password,
      });
    } catch (error) {
      const wrapper = safeEmailInput.closest('.login__field-error-wrapper');
      const apiError = error as ApiError | undefined;

      if (apiError?.status === 409) {
        showFieldMessage(wrapper, 'Такой email уже зарегистрирован', 'var(--color-mid)', true);
        return;
      }

      if (apiError?.status === 400) {
        if (apiError?.details?.email) {
          showFieldMessage(
            wrapper,
            getEmailValidationError(safeEmailInput.value) || 'Проверьте email',
            'var(--color-mid)',
            true,
          );
          return;
        }
        if (apiError?.details?.username) {
          showFieldMessage(
            safeUsernameInput.closest('.login__field-error-wrapper'),
            'Имя: от 3 до 32 символов',
            'var(--color-mid)',
            true,
          );
          return;
        }
        showFieldMessage(wrapper, apiError.message || 'Проверьте данные', 'var(--color-mid)', true);
        return;
      }

      if (apiError?.status && apiError.status >= 500) {
        showFieldMessage(wrapper, 'Сервер временно недоступен. Попробуйте позже', 'var(--color-mid)', true);
        return;
      }

      showFieldMessage(wrapper, 'Не удалось завершить регистрацию. Проверьте соединение и попробуйте снова', 'var(--color-mid)', true);
      return;
    }

    onFinish?.();
  };

  safeUsernameInput.addEventListener('input', validateUsername);
  safeEmailInput.addEventListener('input', validateEmail);
  safePasswordInput.addEventListener('input', updatePasswordField);
  safePasswordInput.addEventListener('focus', updatePasswordField);
  safePasswordInput.addEventListener('blur', handlePasswordBlur);
  safeConfirmInput.addEventListener('input', updateConfirmField);
  safeConfirmInput.addEventListener('focus', updateConfirmField);
  safeConfirmInput.addEventListener('blur', handleConfirmBlur);
  safeSubmitBtn.addEventListener('click', handleSubmitClick);

  return () => {
    safeUsernameInput.removeEventListener('input', validateUsername);
    safeEmailInput.removeEventListener('input', validateEmail);
    safePasswordInput.removeEventListener('input', updatePasswordField);
    safePasswordInput.removeEventListener('focus', updatePasswordField);
    safePasswordInput.removeEventListener('blur', handlePasswordBlur);
    safeConfirmInput.removeEventListener('input', updateConfirmField);
    safeConfirmInput.removeEventListener('focus', updateConfirmField);
    safeConfirmInput.removeEventListener('blur', handleConfirmBlur);
    safeSubmitBtn.removeEventListener('click', handleSubmitClick);
  };
}
