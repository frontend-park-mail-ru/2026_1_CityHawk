import { renderTemplate } from '../../app/templates/renderer.js';
import { attachRegisterForm, renderRegisterStep } from '../../modules/auth/register/register-form.js';
import type { RouteContext, RouteView } from '../../types/router.js';

type RegisterState = {
  step?: number;
};

function renderRegisterHtml(state: RegisterState): string {
  return `
    <main class="login">
      ${renderTemplate('login-aside')}
      ${renderRegisterStep(state)}
    </main>
  `;
}

function createRegisterView(
  state: RegisterState = {},
  { navigate }: Pick<RouteContext, 'navigate'>,
): RouteView {
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

export function registerPage({ navigate }: RouteContext): RouteView {
  return createRegisterView({}, { navigate });
}
