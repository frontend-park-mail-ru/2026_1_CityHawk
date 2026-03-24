import { getHome } from '../../api/home.api.js';
import { getPlaces } from '../../api/events.api.js';
import { getMe } from '../../api/profile.api.js';
import { logout } from '../../api/auth.api.js';
import { attachHeroSearch, renderHeroSearch } from '../../modules/home/hero-search.js';
import { getAccessToken } from '../../modules/session/session.store.js';
import { renderTemplate } from '../../app/templates/renderer.js';

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
  const currentQuery = new URLSearchParams(window.location.search).get('query') || '';
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
    try {
      const placesResponse = await getPlaces();
      const items = Array.isArray(placesResponse?.items) ? placesResponse.items : [];

      homeData = {
        places: items.map((item) => ({
          id: item?.id,
          imageUrl: item?.image_url || '',
          title: item?.title || '',
          description: item?.short_description || '',
        })),
        moodLeft: [],
        moodTall: {},
      };
    } catch {
      homeData = {
        places: [],
        moodLeft: [],
        moodTall: {},
      };
    }
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
      heroSearch: renderHeroSearch({ query: currentQuery }),
      user,
      places: homeData.places,
      moodLeft: homeData.moodLeft,
      moodTall: homeData.moodTall,
    }),
    mount(root) {
      const logoutButton = root.querySelector('[data-action="logout"]');

      attachHeroSearch(root, {
        onSearch(query) {
          const params = new URLSearchParams(window.location.search);

          if (query) {
            params.set('query', query);
          } else {
            params.delete('query');
          }

          const suffix = params.toString() ? `?${params.toString()}` : '';
          navigate(`/${suffix}`);
        },
      });

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
