import { getMe, logout } from '../lib/api.js';
import { getAccessToken } from '../lib/auth-store.js';
import { renderTemplate } from '../templates/renderer.js';

function getUserDisplayName(user) {
  if (!user?.email) {
    return '';
  }

  return user.email.split('@')[0];
}

export async function homePage({ navigate }) {
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

  return {
    html: renderTemplate('home', { user }),
    mount(root) {
      const logoutButton = root.querySelector('[data-action="logout"]');

      const handleLogout = async () => {
        await logout().catch(() => {});
        navigate('/', { replace: true });
      };

      logoutButton?.addEventListener('click', handleLogout);

      return () => {
        logoutButton?.removeEventListener('click', handleLogout);
      };
    },
  };
}
