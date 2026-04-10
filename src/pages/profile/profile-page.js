import { getMeOrNull } from '../../api/profile.api.js';
import { logout } from '../../api/auth.api.js';
import { getHeaderUserDisplayName } from '../../components/header/header-user.js';
import { renderTemplate } from '../../app/templates/renderer.js';

/** @typedef {import('../../types/router.js').RouteContext} RouteContext */
/** @typedef {import('../../types/router.js').RouteView} RouteView */

function getUserInitials(name) {
  const parts = String(name || '')
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2);

  if (!parts.length) {
    return 'CH';
  }

  return parts.map((part) => part[0]?.toUpperCase() || '').join('');
}

/**
 * @param {RouteContext} context
 * @returns {Promise<RouteView>}
 */
export async function profilePage({ navigate }) {
  const me = await getMeOrNull();

  const displayName = getHeaderUserDisplayName(me) || 'Имя';
  const user = {
    name: displayName,
    firstName: me?.username || '',
    lastName: me?.userSurname || '',
    email: me?.email || 'address@service.com',
    birthdate: me?.birthday || '',
    cityId: me?.city?.id || '',
    cityName: me?.city?.name || '',
    cityOptions: [
      {
        value: me?.city?.id || '',
        label: me?.city?.name || 'Выберите город',
        selected: true,
      },
    ],
    initials: getUserInitials(displayName),
    avatarUrl: me?.avatarUrl || '',
    preferences: ['Кино', 'Театр', 'Цирк'],
  };

  const html = renderTemplate('profile', { user });

  return {
    html,
    mount(root) {
      const logoutButton = root.querySelector('.profile__logout-link');

      async function handleLogout() {
        await logout().catch(() => {});
        navigate('/login', { replace: true });
      }

      logoutButton?.addEventListener('click', handleLogout);

      return () => {
        logoutButton?.removeEventListener('click', handleLogout);
      };
    },
  };
}
