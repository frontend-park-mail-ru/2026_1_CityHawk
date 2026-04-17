import { login } from '../../../api/auth.api.js';
import { renderTemplate } from '../../../app/templates/renderer.js';
import { attachPasswordToggles } from '../shared/password-toggle.js';
import { hideFieldError, showFieldError, getErrorMessageElement } from '../shared/field-messages.js';
import { getEmailValidationError } from '../shared/validators.js';
import { attachOAuthButtons } from '../oauth.js';

interface LoginFormOptions {
  onSuccess?: () => void;
}

export function renderLoginForm(): string {
  return renderTemplate('login-form');
}

export function attachLoginForm(root: ParentNode, options: LoginFormOptions = {}): () => void {
  const submitBtn = root.querySelector('.login__submit');
  const emailInput = root.querySelector('#email');
  const passwordInput = root.querySelector('#password');

  if (!(submitBtn instanceof HTMLButtonElement)
    || !(emailInput instanceof HTMLInputElement)
    || !(passwordInput instanceof HTMLInputElement)) {
    return () => {};
  }

  const detachPasswordToggles = attachPasswordToggles(root);
  const detachOAuthButtons = attachOAuthButtons(root);

  let emailError = false;
  let passError = false;

  const handleEmailInput = function handleEmailInput(this: HTMLInputElement): void {
    if (!emailError) return;
    const wrapper = this.closest('.login__field-error-wrapper');
    const validationError = getEmailValidationError(this.value);

    if (validationError) {
      showFieldError(wrapper, validationError);
    } else {
      hideFieldError(wrapper);
      emailError = false;
    }
  };

  const handlePasswordInput = function handlePasswordInput(this: HTMLInputElement): void {
    if (!passError) return;
    const wrapper = this.closest('.login__field-error-wrapper');
    const val = this.value.trim();

    if (!val) {
      showFieldError(wrapper, 'Пароль не должен быть пустым!');
    } else {
      hideFieldError(wrapper);
      passError = false;
    }
  };

  const handleSubmitClick = async (event: Event): Promise<void> => {
    event.preventDefault();

    const emailWrapper = emailInput.closest('.login__field-error-wrapper');
    const passWrapper = passwordInput.closest('.login__field-error-wrapper');
    const emailVal = emailInput.value.trim();
    const passVal = passwordInput.value.trim();

    emailError = false;
    passError = false;

    const emailValidationError = getEmailValidationError(emailVal);
    if (emailValidationError) {
      showFieldError(emailWrapper, emailValidationError);
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
  };

  emailInput.addEventListener('input', handleEmailInput);
  passwordInput.addEventListener('input', handlePasswordInput);
  submitBtn.addEventListener('click', handleSubmitClick);

  return () => {
    emailInput.removeEventListener('input', handleEmailInput);
    passwordInput.removeEventListener('input', handlePasswordInput);
    submitBtn.removeEventListener('click', handleSubmitClick);
    detachPasswordToggles();
    detachOAuthButtons();
  };
}
