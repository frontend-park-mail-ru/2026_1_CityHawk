import { getMe } from '../../api/profile.api.js';
import { getAccessToken } from '../../modules/session/session.store.js';
import { attachEventCreateForm, renderEventCreateForm } from '../../modules/events/event-create-form.js';
import { renderTemplate } from '../../app/templates/renderer.js';

/**
 * Формирует короткое имя пользователя из email.
 *
 * @param {{ email?: string } | null | undefined} user
 * @returns {string}
 */
function getUserDisplayName(user) {
  if (!user?.email) {
    return '';
  }

  return user.email.split('@')[0];
}

/**
 * Страница создания события.
 *
 * @param {{ navigate: (path: string, options?: { replace?: boolean }) => void }} options
 * @returns {Promise<{ html: string, mount(root: HTMLElement): (() => void) }>}
 */
export async function eventCreatePage({ navigate }) {
  const headerQuery = new URLSearchParams(window.location.search).get('query') || '';
  let user = null;

  if (getAccessToken()) {
    try {
      const me = await getMe();
      user = {
        ...me,
        displayName: getUserDisplayName(me),
      };
    } catch {
      user = null;
    }
  }

  const eventCreateForm = renderEventCreateForm();

  const html = renderTemplate('event-create', {
    eventCreateForm,
    user,
    headerSearch: { query: headerQuery },
  });

  return {
    html,
    mount(root) {
      const headerSearchForm = root.querySelector('[data-role="header-search-form"]');

      const handleHeaderSearchSubmit = (event) => {
        event.preventDefault();

        const formData = new FormData(headerSearchForm);
        const query = String(formData.get('query') || '').trim();
        const params = new URLSearchParams();

        if (query) {
          params.set('query', query);
        }

        const suffix = params.toString() ? `?${params.toString()}` : '';
        navigate(`/events${suffix}`);
      };

      headerSearchForm?.addEventListener('submit', handleHeaderSearchSubmit);

      const detachEventCreateForm = attachEventCreateForm(root, {
        onSubmit() {},
        onCancel() {
          navigate('/events');
        },
      });

      return () => {
        headerSearchForm?.removeEventListener('submit', handleHeaderSearchSubmit);
        detachEventCreateForm();
      };
    },
  };
}
