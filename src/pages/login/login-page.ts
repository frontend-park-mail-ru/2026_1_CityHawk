import { renderTemplate } from '../../app/templates/renderer.js';
import { attachLoginForm } from '../../modules/auth/login/login-form.js';
import {
  decorateAuthSwitchLinks,
  resolveReturnToFromSearch,
} from '../../app/router/auth-return-to.js';
import type { RouteContext, RouteView } from '../../types/router.js';

function animateLoginTickets(root: HTMLElement): void {
  const loginEl = root.classList.contains('login') ? root : root.querySelector('.login');

  if (!(loginEl instanceof HTMLElement)) {
    return;
  }

  setTimeout(() => loginEl.classList.add('loaded'), 100);
}

function createLoginView({ navigate }: Pick<RouteContext, 'navigate'>): RouteView {
  const returnTo = resolveReturnToFromSearch(window.location.search);

  return {
    html: renderTemplate('login'),
    mount(root) {
      animateLoginTickets(root);
      decorateAuthSwitchLinks(root, returnTo);
      const detachLoginForm = attachLoginForm(root, {
        onSuccess() {
          navigate(returnTo, { replace: true });
        },
      });

      return () => {
        detachLoginForm();
      };
    },
  };
}

export function loginPage({ navigate }: RouteContext): RouteView {
  return createLoginView({ navigate });
}
