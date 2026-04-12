import { getHome } from '../../api/home.api.js';
import { getMeOrNull } from '../../api/profile.api.js';
import { logout } from '../../api/auth.api.js';
import { getHeaderUserDisplayName } from '../../components/header/header-user.js';
import { renderHomeEventsSection } from '../../modules/home/home-events-section.js';
import { renderHomeMoodSection } from '../../modules/home/home-mood-section.js';
import { attachHeroSearch, renderHeroSearch } from '../../modules/home/hero-search.js';
import { renderTemplate } from '../../app/templates/renderer.js';
import type { Collection, EventCard, HomeResponse, User } from '../../types/api.js';
import type { RouteContext, RouteView } from '../../types/router.js';

interface HomeEventCardViewModel {
  id: string;
  imageUrl: string;
  title: string;
  tags: string[];
  dateText: string;
  placeText: string;
}

interface MoodViewModel {
  imageUrl: string;
  title: string;
  modifier: string;
}

function formatEventDate(value?: string | null): string {
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

function mapFeaturedEventToCardViewModel(event: Partial<EventCard> = {}): HomeEventCardViewModel {
  const tags = Array.isArray(event.tags)
    ? event.tags.map((tag) => tag?.name || '').filter(Boolean)
    : [];
  const placeParts = [
    event.nextSession?.place?.name,
    event.nextSession?.place?.addressLine,
  ].filter(Boolean);

  return {
    id: event.id || '',
    imageUrl: event.coverImageUrl || '',
    title: event.title || '',
    tags,
    dateText: formatEventDate(event.nextSession?.startAt),
    placeText: placeParts.join(', '),
  };
}

function mapCollectionToMoodViewModel(collection: Partial<Collection> = {}, modifier = ''): MoodViewModel {
  return {
    imageUrl: collection.imageUrl || '',
    title: collection.title || '',
    modifier,
  };
}

function getFallbackHomeData(): HomeResponse {
  return {
    featuredEvents: [
      {
        id: 'futurione',
        title: 'Futurione',
        coverImageUrl: '/public/static/img/futurione.jpeg',
        tags: [
          { id: 'digital', name: 'Digital', slug: 'digital' },
          { id: 'art', name: 'Art', slug: 'art' },
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
          { id: 'comedy', name: 'Comedy', slug: 'comedy' },
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
          { id: 'show', name: 'Show', slug: 'show' },
          { id: 'ice', name: 'Ice', slug: 'ice' },
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
        description: '',
        imageUrl: '/public/static/img/concert.jpeg',
      },
      {
        id: 'art-space',
        title: 'Арт и выставки',
        description: '',
        imageUrl: '/public/static/img/art.png',
      },
      {
        id: 'city-vibes',
        title: 'Городской вайб',
        description: '',
        imageUrl: '/public/static/img/photo.jpeg',
      },
    ],
  };
}

export async function homePage({ navigate }: RouteContext): Promise<RouteView> {
  const query = new URLSearchParams(window.location.search).get('query') || '';
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

  const me = await getMeOrNull();
  const user: (User & { displayName: string }) | null = me
    ? {
      ...me,
      displayName: getHeaderUserDisplayName(me),
    }
    : null;

  const eventCards = homeData.featuredEvents.map(mapFeaturedEventToCardViewModel);
  const moodLeft = homeData.collections
    .slice(0, 2)
    .map((collection, index) => mapCollectionToMoodViewModel(
      collection,
      index === 0 ? 'mood-card--wide' : '',
    ));
  const moodTall = homeData.collections[2]
    ? mapCollectionToMoodViewModel(homeData.collections[2])
    : { imageUrl: '', title: '', modifier: '' };

  const html = renderTemplate('home', {
    heroSearch: renderHeroSearch({ query }),
    homeEventsSection: renderHomeEventsSection({ events: eventCards }),
    homeMoodSection: renderHomeMoodSection({ moodLeft, moodTall }),
    user,
  });

  return {
    html,
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

      if (logoutButton instanceof HTMLElement) {
        logoutButton.addEventListener('click', handleLogout);
      }

      return () => {
        if (logoutButton instanceof HTMLElement) {
          logoutButton.removeEventListener('click', handleLogout);
        }
      };
    },
  };
}
