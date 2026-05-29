import { getHome } from '../../api/home.api.js';
import { getMyFavorites } from '../../api/favorites.api.js';
import { getMeOrNull } from '../../api/profile.api.js';
import { logout } from '../../api/auth.api.js';
import { getHeaderUserDisplayName } from '../../components/header/header-user.js';
import { attachHeaderCityPicker } from '../../components/header/header-city-picker.js';
import { renderHomeEventsSection } from '../../modules/home/home-events-section.js';
import { renderHomeMoodSection } from '../../modules/home/home-mood-section.js';
import { attachHeroSearch, renderHeroSearch } from '../../modules/home/hero-search.js';
import { renderTemplate } from '../../app/templates/renderer.js';
import { formatEventDateOrPeriod } from '../../modules/events/common/event-date-label.js';
import type { Collection, EventCard, HomeResponse, User } from '../../types/api.js';
import type { RouteContext, RouteView } from '../../types/router.js';

interface HomeEventCardViewModel {
  id: string;
  imageUrl: string;
  title: string;
  tags: string[];
  dateText: string;
  placeText: string;
  isFavorite: boolean;
}

interface MoodViewModel {
  imageUrl: string;
  title: string;
  modifier?: string;
  collectionId: string;
  href: string;
}

const FALLBACK_MOOD_IMAGES = [
  '/public/static/img/concert.jpeg',
  '/public/static/img/art.png',
  '/public/static/img/photo.jpeg',
  '/public/static/img/navka.jpeg',
];

function mapFeaturedEventToCardViewModel(event: Partial<EventCard> = {}): HomeEventCardViewModel {
  const tags = Array.isArray(event.tags)
    ? event.tags.map((tag) => tag?.name || '').filter(Boolean)
    : [];
  const placeParts = [
    event.nextSession?.placeName || event.nextSession?.place?.name,
    event.nextSession?.place?.addressLine,
  ].filter(Boolean);
  const fallbackPlaceParts = [
    event.placeName || event.place?.name,
    event.place?.addressLine,
  ].filter(Boolean);

  return {
    id: event.id || '',
    imageUrl: event.coverImageUrl || '',
    title: event.title || '',
    tags,
    dateText: formatEventDateOrPeriod(event),
    placeText: placeParts.join(', ') || fallbackPlaceParts.join(', '),
    isFavorite: Boolean(event.isFavorite),
  };
}

function buildCollectionMoodCards(collections: Collection[]): MoodViewModel[] {
  const top = collections
    .slice(0, 5)
    .map((item, index) => ({
      collectionId: String(item.id || '').trim(),
      title: String(item.title || '').trim() || 'Подборка',
      imageUrl: String(item.imageUrl || '').trim() || FALLBACK_MOOD_IMAGES[index % FALLBACK_MOOD_IMAGES.length],
      href: `/events-map?collectionId=${encodeURIComponent(String(item.id || '').trim())}`,
    }))
    .filter((item) => item.collectionId);

  if (top.length === 5) {
    return top;
  }

  const fallbackTitles = ['Популярное', 'Семейное', 'Вечернее', 'Выходные', 'Тренды'];
  const result = [...top];

  for (let index = result.length; index < 5; index += 1) {
    result.push({
      collectionId: '',
      title: fallbackTitles[index] || 'Популярное',
      imageUrl: FALLBACK_MOOD_IMAGES[index % FALLBACK_MOOD_IMAGES.length],
      href: '/events-map',
    });
  }

  return result;
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
  const searchParams = new URLSearchParams(window.location.search);
  const query = searchParams.get('query') || '';
  const city = searchParams.get('city') || '';
  const fallbackHomeData = getFallbackHomeData();
  let homeData = fallbackHomeData;

  try {
    const response = await getHome({ city });
    const featuredEvents = Array.isArray(response?.featuredEvents) ? response.featuredEvents : [];
    const categories = Array.isArray(response?.categories) ? response.categories : [];
    const collections = Array.isArray(response?.collections) ? response.collections : [];

    homeData = {
      featuredEvents: featuredEvents.length > 0 ? featuredEvents : fallbackHomeData.featuredEvents,
      categories,
      collections: collections.length > 0 ? collections : fallbackHomeData.collections,
    };
  } catch {
    homeData = fallbackHomeData;
  }

  let me: User | null = null;
  try {
    me = await getMeOrNull();
  } catch {
    me = null;
  }

  if (me) {
    try {
      const favoritesResponse = await getMyFavorites(100, 0);
      const favoriteIds = new Set(
        Array.isArray(favoritesResponse?.items)
          ? favoritesResponse.items.map((item) => String(item.id || '').trim()).filter(Boolean)
          : [],
      );

      if (favoriteIds.size > 0) {
        homeData = {
          ...homeData,
          featuredEvents: homeData.featuredEvents.map((event) => ({
            ...event,
            isFavorite: Boolean(event?.isFavorite) || favoriteIds.has(String(event?.id || '').trim()),
          })),
        };
      }
    } catch {
      // Keep homepage resilient even if favorites sync is temporarily unavailable.
    }
  }

  const user: (User & { displayName: string }) | null = me
    ? {
      ...me,
      displayName: getHeaderUserDisplayName(me),
    }
    : null;

  const eventCards = homeData.featuredEvents.map(mapFeaturedEventToCardViewModel);
  const moodCards = buildCollectionMoodCards(homeData.collections);
  const moodLeft = moodCards.slice(0, 3).map((card, index) => ({
    ...card,
    modifier: index === 0 ? 'mood-card--wide' : '',
  }));
  const moodRight = moodCards.slice(3, 5);

  const html = renderTemplate('home', {
    heroSearch: renderHeroSearch({ query }),
    homeEventsSection: renderHomeEventsSection({ events: eventCards }),
    homeMoodSection: renderHomeMoodSection({ moodLeft, moodRight }),
    user,
  });

  return {
    html,
    mount(root) {
      const logoutButton = root.querySelector('[data-action="logout"]');
      const detachCityPicker = attachHeaderCityPicker(root, { navigate });

      const detachHeroSearch = attachHeroSearch(root, {
        onSearch(nextQuery) {
          const params = new URLSearchParams(window.location.search);

          if (nextQuery) {
            params.set('query', nextQuery);
          } else {
            params.delete('query');
          }

          const suffix = params.toString() ? `?${params.toString()}` : '';
          navigate(`/events${suffix}`);
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
        detachCityPicker();
        detachHeroSearch();

        if (logoutButton instanceof HTMLElement) {
          logoutButton.removeEventListener('click', handleLogout);
        }
      };
    },
  };
}
