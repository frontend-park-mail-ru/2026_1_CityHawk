import { getHome, getMe, logout } from '../lib/api.js';
import { getAccessToken } from '../lib/auth-store.js';
import { renderTemplate } from '../templates/renderer.js';

/**
 * Формирует короткое имя пользователя из email.
 *
 * @param {{ email?: string } | null | undefined} user Данные пользователя.
 * @returns {string}
 */
function getUserDisplayName(user) {
  if (!user?.email) {
    return '';
  }

  return user.email.split('@')[0];
}

/**
 * Создаёт представление главной страницы, загружает данные и подключает выход из аккаунта.
 *
 * @param {{ navigate: (path: string, options?: { replace?: boolean }) => void }} options Параметры маршрута.
 * @returns {Promise<{ html: string, mount(root: HTMLElement): (() => void) }>}
 */
export async function homePage({ navigate }) {
  let user = null;
  let homeData = {
    places: [],
    moodLeft: [],
    moodTall: {},
  };

  try {
    const response = await getHome();
    homeData = {
      places: Array.isArray(response?.places) ? response.places : [],
      moodLeft: Array.isArray(response?.moodLeft) ? response.moodLeft : [],
      moodTall: response?.moodTall ?? {},
    };
  } catch {
    homeData = {
      places: [],
      moodLeft: [],
      moodTall: {},
    };
  }

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
    html: renderTemplate('home', {
      user,
      places: homeData.places,
      moodLeft: homeData.moodLeft,
      moodTall: homeData.moodTall,
    }),
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
