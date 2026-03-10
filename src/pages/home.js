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
      if (!logoutButton) {
        return;
      }

      logoutButton.addEventListener('click', async () => {
        await logout().catch(() => {});
        navigate('/', { replace: true });
      });
    },
  };
}
