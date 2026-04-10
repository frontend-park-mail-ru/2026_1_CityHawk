import { login } from '../../../api/auth.api.js';
import { renderTemplate } from '../../../app/templates/renderer.js';
import { attachPasswordToggles } from '../shared/password-toggle.js';
import { hideFieldError, showFieldError, getErrorMessageElement } from '../shared/field-messages.js';
import { isValidEmail } from '../shared/validators.js';
import { attachOAuthButtons } from '../oauth.js';

interface LoginFormOptions {
  onSuccess?: () => void;
}

export function renderLoginForm(): string {
  return renderTemplate('login-form');
}

export function attachLoginForm(root: ParentNode, options: LoginFormOptions = {}): void {
  const submitBtn = root.querySelector('.login__submit');
  const emailInput = root.querySelector('#email');
  const passwordInput = root.querySelector('#password');

  if (!(submitBtn instanceof HTMLButtonElement)
    || !(emailInput instanceof HTMLInputElement)
    || !(passwordInput instanceof HTMLInputElement)) {
    return;
  }

  attachPasswordToggles(root);
  attachOAuthButtons(root);

  let emailError = false;
  let passError = false;

  emailInput.addEventListener('input', function handleEmailInput() {
    if (!emailError) return;
    const wrapper = this.closest('.login__field-error-wrapper');
    const val = this.value.trim();

    if (!val) {
      showFieldError(wrapper, 'Поле email не должно быть пустым!');
    } else if (!isValidEmail(val)) {
      showFieldError(wrapper, 'Введите email в формате address@service.com!');
    } else {
      hideFieldError(wrapper);
      emailError = false;
    }
  });

  passwordInput.addEventListener('input', function handlePasswordInput() {
    if (!passError) return;
    const wrapper = this.closest('.login__field-error-wrapper');
    const val = this.value.trim();

    if (!val) {
      showFieldError(wrapper, 'Пароль не должен быть пустым!');
    } else {
      hideFieldError(wrapper);
      passError = false;
    }
  });

  submitBtn.addEventListener('click', async (event) => {
    event.preventDefault();

    const emailWrapper = emailInput.closest('.login__field-error-wrapper');
    const passWrapper = passwordInput.closest('.login__field-error-wrapper');
    const emailVal = emailInput.value.trim();
    const passVal = passwordInput.value.trim();

    emailError = false;
    passError = false;

    if (!emailVal) {
      showFieldError(emailWrapper, 'Поле email не должно быть пустым!');
      emailError = true;
    } else if (!isValidEmail(emailVal)) {
      showFieldError(emailWrapper, 'Введите email в формате address@service.com!');
      emailError = true;
    } else {
      hideFieldError(emailWrapper);
    }

    if (!passVal) {
      showFieldError(passWrapper, 'Пароль не должен быть пустым!');
      passError = true;
    } else {
      hideFieldError(passWrapper);
    }

    if (emailError || passError) {
      return;
    }

    try {
      await login({ email: emailVal, password: passVal });
      options.onSuccess?.();
    } catch {
      emailWrapper?.classList.add('login__field-error-wrapper--error');
      passWrapper?.classList.add('login__field-error-wrapper--error');

      const emailErrorMsg = getErrorMessageElement(emailWrapper);
      if (emailErrorMsg) {
        emailErrorMsg.textContent = 'Пользователь не найден';
      }

      const passErrorMsg = getErrorMessageElement(passWrapper);
      if (passErrorMsg) {
        passErrorMsg.textContent = '';
      }
    }
  });
}
