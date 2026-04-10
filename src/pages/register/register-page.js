import { renderTemplate } from '../../app/templates/renderer.js';
import { attachRegisterForm, renderRegisterStep } from '../../modules/auth/register/register-form.js';

/** @typedef {import('../../types/router.js').RouteContext} RouteContext */
/** @typedef {import('../../types/router.js').RouteView} RouteView */

function renderRegisterHtml(state) {
  return `
    <main class="login">
      ${renderTemplate('login-aside')}
      ${renderRegisterStep(state)}
    </main>
  `;
}

/**
 * @param {Record<string, unknown>} [state]
 * @param {{ navigate: RouteContext['navigate'] }} options
 * @returns {RouteView}
 */
function createRegisterView(state = {}, { navigate }) {
  state.step = state.step || 1;

  return {
    html: renderRegisterHtml(state),
    mount(root) {
      const rerender = () => {
        root.innerHTML = renderRegisterHtml(state);
        attachRegisterForm(root, {
          state,
          rerender,
          onFinish() {
            navigate('/');
          },
        });
      };

      attachRegisterForm(root, {
        state,
        rerender,
        onFinish() {
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
export function registerPage({ navigate }) {
  return createRegisterView({}, { navigate });
}
