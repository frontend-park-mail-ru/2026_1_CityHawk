import { getHome } from '../../api/home.api.js';
import { getMe } from '../../api/profile.api.js';
import { logout } from '../../api/auth.api.js';
import { renderHomeEventsSection } from '../../modules/home/home-events-section.js';
import { renderHomeMoodSection } from '../../modules/home/home-mood-section.js';
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
 * Форматирует ISO-дату в короткий текст для карточки события.
 *
 * @param {string | null | undefined} value
 * @returns {string}
 */
function formatEventDate(value) {
  if (!value) {
    return '';
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return String(value);
  }

  return new Intl.DateTimeFormat('ru-RU', {
    day: 'numeric',
    month: 'long',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

/**
 * Преобразует событие из API в формат карточки для home-events-section.
 *
 * @param {Record<string, any>} event
 * @returns {{
 *   id: string,
 *   imageUrl: string,
 *   title: string,
 *   tags: string[],
 *   dateText: string,
 *   placeText: string
 * }}
 */
function mapFeaturedEventToCardViewModel(event = {}) {
  const tags = Array.isArray(event?.tags)
    ? event.tags
      .map((tag) => tag?.name || '')
      .filter(Boolean)
    : [];
  const place = event?.nextSession?.place || {};
  const placeParts = [
    place?.name,
    place?.addressLine,
  ].filter(Boolean);

  return {
    id: event?.id || '',
    imageUrl: event?.coverImageUrl || '',
    title: event?.title || '',
    tags,
    dateText: formatEventDate(event?.nextSession?.startAt),
    placeText: placeParts.join(', '),
  };
}

/**
 * Преобразует подборку из API в формат карточки для mood-section.
 *
 * @param {Record<string, any>} collection
 * @param {string} [modifier]
 * @returns {{ imageUrl: string, title: string, modifier: string }}
 */
function mapCollectionToMoodViewModel(collection = {}, modifier = '') {
  return {
    imageUrl: collection?.imageUrl || '',
    title: collection?.title || '',
    modifier,
  };
}

/**
 * Возвращает demo-данные главной страницы в формате API /api/home.
 *
 * @returns {{
 *   featuredEvents: Array<Record<string, any>>,
 *   categories: Array<Record<string, any>>,
 *   collections: Array<Record<string, any>>
 * }}
 */
function getFallbackHomeData() {
  return {
    featuredEvents: [
      {
        id: 'futurione',
        title: 'Futurione',
        coverImageUrl: '/public/static/img/futurione.jpeg',
        tags: [
          { id: 'digital', name: 'Digital' },
          { id: 'art', name: 'Art' },
        ],
        nextSession: {
          startAt: '2026-04-05T19:00:00Z',
          place: {
            name: 'ВДНХ',
            addressLine: '2-я Останкинская улица, 3',
          },
        },
      },
      {
        id: 'standup',
        title: 'Женский стендап',
        coverImageUrl: '/public/static/img/standup.png',
        tags: [
          { id: 'comedy', name: 'Comedy' },
        ],
        nextSession: {
          startAt: '2026-04-07T18:30:00Z',
          place: {
            name: 'Live Арена',
            addressLine: 'Москва',
          },
        },
      },
      {
        id: 'navka',
        title: 'Ледовое шоу Татьяны Навки',
        coverImageUrl: '/public/static/img/navka.jpeg',
        tags: [
          { id: 'show', name: 'Show' },
          { id: 'ice', name: 'Ice' },
        ],
        nextSession: {
          startAt: '2026-04-10T20:00:00Z',
          place: {
            name: 'Навка Арена',
            addressLine: 'Москва',
          },
        },
      },
    ],
    categories: [],
    collections: [
      {
        id: 'weekend',
        title: 'Выходные',
        imageUrl: '/public/static/img/concert.jpeg',
      },
      {
        id: 'art-space',
        title: 'Арт и выставки',
        imageUrl: '/public/static/img/art.png',
      },
      {
        id: 'city-vibes',
        title: 'Городской вайб',
        imageUrl: '/public/static/img/photo.jpeg',
      },
    ],
  };
}

/**
 * Создаёт представление главной страницы, загружает данные и подключает выход из аккаунта.
 *
 * @param {{ navigate: (path: string, options?: { replace?: boolean }) => void }} options Параметры маршрута.
 * @returns {Promise<{ html: string, mount(root: HTMLElement): (() => void) }>}
 */
export async function homePage({ navigate }) {
  // 1. Получить query из URL.
  const query = new URLSearchParams(window.location.search).get('query') || '';

  // 2. Загрузить getHome() и сохранить homeData.
  let homeData = getFallbackHomeData();

  try {
    const response = await getHome();
    homeData = {
      featuredEvents: Array.isArray(response?.featuredEvents) ? response.featuredEvents : [],
      categories: Array.isArray(response?.categories) ? response.categories : [],
      collections: Array.isArray(response?.collections) ? response.collections : [],
    };
  } catch {
    homeData = getFallbackHomeData();
  }

  // Отдельный блок авторизации пока оставляем как есть, так как им занимается другая часть команды.
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

  // 3. Получить eventCards для модуля карточек.
  const eventCards = homeData.featuredEvents.map(mapFeaturedEventToCardViewModel);
  const moodLeft = homeData.collections
    .slice(0, 2)
    .map((collection, index) => mapCollectionToMoodViewModel(
      collection,
      index === 0 ? 'mood-card--wide' : '',
    ));
  const moodTall = homeData.collections[2]
    ? mapCollectionToMoodViewModel(homeData.collections[2])
    : { imageUrl: '', title: '' };

  // 4. Собрать html страницы из модулей.
  const html = renderTemplate('home', {
    heroSearch: renderHeroSearch({ query }),
    homeEventsSection: renderHomeEventsSection({ events: eventCards }),
    homeMoodSection: renderHomeMoodSection({ moodLeft, moodTall }),
    user,
  });

  return {
    html,
    // 5. Подключить mount.
    mount(root) {
      const logoutButton = root.querySelector('[data-action="logout"]');

      attachHeroSearch(root, {
        onSearch(nextQuery) {
          const params = new URLSearchParams(window.location.search);

          if (nextQuery) {
            params.set('query', nextQuery);
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
