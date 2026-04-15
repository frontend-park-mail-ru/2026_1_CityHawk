import '../../modules/auth/auth.css';
import { renderTemplate } from '../../app/templates/renderer.js';
import { hideFieldError, showFieldError } from '../../modules/auth/shared/field-messages.js';
import { isValidEmail } from '../../modules/auth/shared/validators.js';
import type { RouteView } from '../../types/router.js';

interface PasswordResetState {
  email?: string;
  step: 1 | 2;
}

function setTicketsFinalState(root: ParentNode | null | undefined): void {
  if (!root) {
    return;
  }

  const loginEl = root instanceof Element && root.classList.contains('login')
    ? root
    : root.querySelector('.login');

  if (loginEl instanceof HTMLElement) {
    loginEl.classList.add('loaded');
  }
}

function navigateSpa(path: string): void {
  window.history.pushState(null, '', path);
  window.dispatchEvent(new PopStateEvent('popstate'));
}

function setupStep1(
  root: ParentNode,
  state: PasswordResetState,
  rerender: () => void,
): void {
  const emailInput = root.querySelector('#email');
  const submitBtn = root.querySelector('.login__submit');
  const backLink = root.querySelector('.login__register');

  if (!(emailInput instanceof HTMLInputElement) || !(submitBtn instanceof HTMLButtonElement)) {
    return;
  }

  let emailError = false;
  emailInput.value = state.email || '';

  emailInput.addEventListener('input', function handleEmailInput(this: HTMLInputElement) {
    if (!emailError) {
      return;
    }

    const wrapper = this.closest('.login__field-error-wrapper');
    const value = this.value.trim();

    if (!value) {
      showFieldError(wrapper, 'Поле email не должно быть пустым!');
    } else if (!isValidEmail(value)) {
      showFieldError(wrapper, 'Введите email в формате address@service.com!');
    } else {
      hideFieldError(wrapper);
      emailError = false;
    }
  });

  submitBtn.addEventListener('click', (event) => {
    event.preventDefault();

    const wrapper = emailInput.closest('.login__field-error-wrapper');
    const value = emailInput.value.trim();

    emailError = false;

    if (!value) {
      showFieldError(wrapper, 'Поле email не должно быть пустым!');
      emailError = true;
    } else if (!isValidEmail(value)) {
      showFieldError(wrapper, 'Введите email в формате address@service.com!');
      emailError = true;
    } else {
      hideFieldError(wrapper);
    }

    if (emailError) {
      return;
    }

    state.email = value;
    state.step = 2;
    rerender();
  });

  if (backLink instanceof HTMLAnchorElement) {
    backLink.addEventListener('click', (event) => {
      event.preventDefault();
      navigateSpa('/login');
    });
  }
}

function setupStep2(root: ParentNode): void {
  const backBtn = root.querySelector('.js-go-login');

  if (!(backBtn instanceof HTMLElement)) {
    return;
  }

  backBtn.addEventListener('click', (event) => {
    event.preventDefault();
    navigateSpa('/login');
  });
}

function getStepTemplate(step: PasswordResetState['step']): 'reset_password-step1' | 'reset_password-step2' {
  switch (step) {
    case 1:
      return 'reset_password-step1';
    case 2:
      return 'reset_password-step2';
  }
}

function mountPasswordReset(
  root: HTMLElement,
  state: PasswordResetState,
  rerender: () => void,
): void {
  setTicketsFinalState(root);

  if (state.step === 1) {
    setupStep1(root, state, rerender);
  }

  if (state.step === 2) {
    setupStep2(root);
  }
}

function createPasswordResetView(
  state: PasswordResetState = { step: 1 },
): RouteView {
  const html = `
    <main class="login">
      ${renderTemplate('login-aside')}
      ${renderTemplate(getStepTemplate(state.step), state)}
    </main>
  `;

  return {
    html,
    mount(root) {
      root.innerHTML = html;

      const rerender = () => {
        const view = createPasswordResetView(state);
        view.mount?.(root);
      };

      mountPasswordReset(root, state, rerender);
    },
  };
}

export function passwordResetPage(): RouteView {
  return createPasswordResetView();
}
