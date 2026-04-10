import { renderTemplate } from '../../app/templates/renderer.js';
import { attachLoginForm } from '../../modules/auth/login/login-form.js';

/** @typedef {import('../../types/router.js').RouteContext} RouteContext */
/** @typedef {import('../../types/router.js').RouteView} RouteView */

function animateLoginTickets(root) {
  if (!root) return;
  const loginEl = root.classList.contains('login') ? root : root.querySelector('.login');
  if (!loginEl) return;
  setTimeout(() => loginEl.classList.add('loaded'), 100);
}

/**
 * @param {{ navigate: RouteContext['navigate'] }} options
 * @returns {RouteView}
 */
function createLoginView({ navigate }) {
  return {
    html: renderTemplate('login'),
    mount(root) {
      animateLoginTickets(root);
      attachLoginForm(root, {
        onSuccess() {
          navigate('/');
        },
      });
    },
  };
}

/**
 * @param {RouteContext} context
 * @returns {RouteView}
 */
export function loginPage({ navigate }) {
  return createLoginView({ navigate });
}
