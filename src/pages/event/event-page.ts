import { getEventById, getEvents } from '../../api/events.api.js';
import { getMeOrNull } from '../../api/profile.api.js';
import { getHeaderUserDisplayName } from '../../components/header/header-user.js';
import { attachHeaderSearchSuggestions } from '../../components/header/header-search-suggestions.js';
import { renderTemplate } from '../../app/templates/renderer.js';
import { attachEventDescription, renderEventDescription } from '../../modules/events/event-description.js';
import { renderEventGallery } from '../../modules/events/event-gallery.js';
import { renderEventHero } from '../../modules/events/event-hero.js';
import { renderEventLocation } from '../../modules/events/event-location.js';
import { renderEventRecommendations } from '../../modules/events/event-recommendations.js';
import type {
  EventCard,
  EventDetails,
  EventImage,
  EventSession,
  Place,
  User,
} from '../../types/api.js';
import type { RouteContext, RouteView } from '../../types/router.js';

interface GalleryImageViewModel {
  imageUrl: string;
  alt: string;
}

interface EventPageViewModel {
  id: string;
  authorId: string;
  category: string;
  title: string;
  dateText: string;
  placeText: string;
  posterUrl: string;
  leadText: string;
  paragraphs: string[];
  locationParagraphs: string[];
  galleryImages: GalleryImageViewModel[];
  mapImageUrl: string;
  mapAlt: string;
}

interface RecommendationViewModel {
  id: string;
  imageUrl: string;
  title: string;
  description: string;
  tags: string[];
}

interface LoosePlace extends Partial<Omit<Place, 'city'>> {
  city?: Partial<NonNullable<Place['city']>> | null;
  description?: string;
}

type EventDetailsLike = Omit<Partial<EventDetails>, 'images' | 'sessions'> & {
  dateText?: string;
  city?: Partial<NonNullable<Place['city']>> | null;
  category?: {
    name?: string;
  };
  place?: LoosePlace | null;
  images?: Array<Partial<EventImage> & { url?: string; alt?: string }>;
  sessions?: Array<Partial<Omit<EventSession, 'place'>> & { place?: LoosePlace | null }>;
};

function formatEventDate(value?: string | null): string {
  if (!value) {
    return 'Дата уточняется';
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

function mapEventImagesToGalleryViewModel(rawEvent: EventDetailsLike): GalleryImageViewModel[] {
  const images = Array.isArray(rawEvent.images) ? rawEvent.images : [];
  const title = rawEvent.title || 'Мероприятие';

  if (images.length > 0) {
    return images.slice(0, 4).map((item, index) => ({
      imageUrl: item.imageUrl || item.url || '',
      alt: item.alt || `${title} - кадр ${index + 1}`,
    }));
  }

  return [
    { imageUrl: '/public/static/img/futurione.jpeg', alt: `${title} - постер` },
    { imageUrl: '/public/static/img/photo.jpeg', alt: `${title} - атмосфера` },
    { imageUrl: '/public/static/img/art.png', alt: `${title} - детали` },
    { imageUrl: '/public/static/img/concert.jpeg', alt: `${title} - площадка` },
  ];
}

function mapEventDetailsToPageViewModel(rawEvent: EventDetailsLike = {}): EventPageViewModel {
  const firstSession = Array.isArray(rawEvent.sessions) ? rawEvent.sessions[0] : null;
  const place: LoosePlace | null = firstSession?.place || rawEvent.place || null;
  const title = rawEvent.title || 'Futurione';
  const description = rawEvent.fullDescription || '';
  const paragraphs = description
    .split(/\n{2,}/)
    .map((part) => part.trim())
    .filter(Boolean);

  const safeParagraphs = paragraphs.length > 0
    ? paragraphs
    : [
      'Погрузитесь в атмосферу события, где музыка, пространство и настроение собираются в один цельный опыт.',
      'Мы сохранили модульную структуру страницы, чтобы позже сюда безболезненно подключить реальные данные с backend.',
      'Каркас уже готов для полноценной деталки мероприятия с галереей, локацией и рекомендациями.',
    ];

  const locationParts = [
    place?.addressLine,
    place?.name,
    place?.city?.name || rawEvent.city?.name,
  ].filter(Boolean);
  const categories = Array.isArray(rawEvent.categories) ? rawEvent.categories : [];
  const legacyCategoryName = rawEvent.category?.name || '';
  const category = categories[0]?.name || legacyCategoryName || 'Мероприятие';
  const galleryImages = mapEventImagesToGalleryViewModel(rawEvent);

  return {
    id: String(rawEvent.id || ''),
    authorId: String(rawEvent.author?.id || '').trim(),
    category,
    title,
    dateText: formatEventDate(firstSession?.startAt || rawEvent.dateText),
    placeText: locationParts.join(', ') || 'Локация уточняется',
    posterUrl: rawEvent.coverImageUrl || galleryImages[0]?.imageUrl || '',
    leadText: rawEvent.shortDescription || 'Актуальная информация о событии, времени и формате посещения.',
    paragraphs: safeParagraphs,
    locationParagraphs: [
      locationParts.join(', ') || 'Адрес будет добавлен позже.',
    place?.description || 'Подробная навигация и ориентиры для посетителей появятся после интеграции с backend.',
    ],
    galleryImages,
    mapImageUrl: '/public/static/img/map.jpeg',
    mapAlt: `Карта для ${title}`,
  };
}

function getFallbackEvent(eventId: string): EventDetailsLike {
  return {
    id: eventId,
    title: 'Futurione',
    shortDescription: 'Фиджитал-пространство, где искусство и цифровые технологии создают новый зрительский опыт.',
    fullDescription: [
      'Погрузитесь в уникальное цифровое арт-пространство Futurione - место, где искусство переплетается с технологиями будущего, а каждый шаг дарит новые яркие впечатления.',
      'Каждый зал Futurione - это отдельная вселенная: от футуристичных тоннелей и световых коридоров до погружения в живые цифровые леса и абстрактные пространства.',
      'Страница уже собрана как набор модулей, поэтому дальше сюда можно независимо подключать галерею, редактирование и реальные блоки рекомендаций.',
    ].join('\n\n'),
    category: {
      name: 'Выставка',
    },
    sessions: [
      {
        startAt: 'С 19 февраля 2026 года',
        place: {
          name: 'ВДНХ',
          addressLine: '2-я Останкинская улица, 3',
          city: {
            name: 'Москва',
          },
          description: 'Ориентир - колесо обозрения "Солнце Москвы". Вход в пространство расположен у основания комплекса.',
        },
      },
    ],
    images: [
      { imageUrl: '/public/static/img/futurione.jpeg' },
      { imageUrl: '/public/static/img/photo.jpeg' },
      { imageUrl: '/public/static/img/art.png' },
      { imageUrl: '/public/static/img/concert.jpeg' },
    ],
  };
}

function mapEventToRecommendationViewModel(item: Partial<EventCard> = {}): RecommendationViewModel {
  const placeParts = [
    item.nextSession?.place?.name,
    item.nextSession?.place?.addressLine,
  ].filter(Boolean);
  const dateText = formatEventDate(item.nextSession?.startAt);
  const placeText = placeParts.join(', ');
  const tags = Array.isArray(item.tags)
    ? item.tags.map((tag) => tag?.name || '').filter(Boolean)
    : [];

  return {
    id: item.id || '',
    imageUrl: item.coverImageUrl || '/public/static/img/concert.jpeg',
    title: item.title || 'Мероприятие',
    description: [dateText, placeText].filter(Boolean).join(' · ') || 'Подробности скоро появятся',
    tags,
  };
}

function mapRecommendationsToViewModel(
  response: { items?: EventCard[] } | null,
  currentEventId: string,
): RecommendationViewModel[] {
  const items = Array.isArray(response?.items) ? response.items : [];

  const normalized = items
    .filter((item) => String(item.id || '') !== String(currentEventId))
    .slice(0, 4)
    .map(mapEventToRecommendationViewModel);

  if (normalized.length > 0) {
    return normalized;
  }

  return [
    {
      id: '',
      imageUrl: '/public/static/img/standup.png',
      title: 'Женский стендап',
      description: '27 марта · Live Арена, Москва',
      tags: ['Comedy'],
    },
    {
      id: '',
      imageUrl: '/public/static/img/navka.jpeg',
      title: 'Ледовое шоу Татьяны Навки',
      description: '10 февраля · Навка Арена, Москва',
      tags: ['Show', 'Ice'],
    },
    {
      id: '',
      imageUrl: '/public/static/img/balet.jpg',
      title: 'Балет Щелкунчик',
      description: '14 марта · Большой театр, Москва',
      tags: ['Ballet'],
    },
    {
      id: '',
      imageUrl: '/public/static/img/concert.jpeg',
      title: 'Вечерний концерт',
      description: 'Суббота · Центр города',
      tags: ['Music'],
    },
  ];
}

export async function eventPage({ navigate, params = {} }: RouteContext): Promise<RouteView> {
  const eventId = params.eventId || 'demo-event';
  const headerQuery = new URLSearchParams(window.location.search).get('query') || '';
  const me = await getMeOrNull();
  const user: (User & { displayName: string }) | null = me
    ? {
      ...me,
      displayName: getHeaderUserDisplayName(me),
    }
    : null;

  let rawEvent: EventDetailsLike = getFallbackEvent(eventId);

  try {
    rawEvent = await getEventById(eventId);
  } catch {
    rawEvent = getFallbackEvent(eventId);
  }

  let recommendations: RecommendationViewModel[] = [];

  try {
    const response = await getEvents({ limit: 4 });
    recommendations = mapRecommendationsToViewModel(response, eventId);
  } catch {
    recommendations = mapRecommendationsToViewModel(null, eventId);
  }

  const event = mapEventDetailsToPageViewModel(rawEvent);
  const canManageEvent = Boolean(
    user?.id
    && event.authorId
    && String(user.id) === String(event.authorId),
  );

  const html = renderTemplate('event', {
    headerSearch: { query: headerQuery },
    eventHero: renderEventHero({
      eventId,
      category: event.category,
      title: event.title,
      dateText: event.dateText,
      placeText: event.placeText,
      posterUrl: event.posterUrl,
      canManage: canManageEvent,
    }),
    eventDescription: renderEventDescription({
      leadText: event.leadText,
      paragraphs: event.paragraphs,
      hasExtraParagraphs: event.paragraphs.length > 2,
    }),
    eventGallery: renderEventGallery({
      images: event.galleryImages,
    }),
    eventLocation: renderEventLocation({
      paragraphs: event.locationParagraphs,
      mapImageUrl: event.mapImageUrl,
      mapAlt: event.mapAlt,
    }),
    eventRecommendations: renderEventRecommendations({
      items: recommendations,
    }),
    user,
  });

  return {
    html,
    mount(root) {
      const headerSearchForm = root.querySelector('[data-role="header-search-form"]');

      attachEventDescription(root);

      const navigateByHeaderQuery = (nextQuery: string) => {
        const nextParams = new URLSearchParams();

        if (nextQuery) {
          nextParams.set('query', nextQuery);
        }

        const suffix = nextParams.toString() ? '?' + nextParams.toString() : '';
        navigate('/events' + suffix);
      };

      const handleHeaderSearchSubmit = (event: SubmitEvent) => {
        event.preventDefault();

        if (!(headerSearchForm instanceof HTMLFormElement)) {
          return;
        }

        const formData = new FormData(headerSearchForm);
        const query = String(formData.get('query') || '').trim();
        navigateByHeaderQuery(query);
      };

      let detachHeaderSuggestions = () => {};
      if (headerSearchForm instanceof HTMLFormElement) {
        headerSearchForm.addEventListener('submit', handleHeaderSearchSubmit);
        detachHeaderSuggestions = attachHeaderSearchSuggestions(headerSearchForm, {
          onPick(query) {
            navigateByHeaderQuery(query);
          },
        });
      }

      return () => {
        detachHeaderSuggestions();

        if (headerSearchForm instanceof HTMLFormElement) {
          headerSearchForm.removeEventListener('submit', handleHeaderSearchSubmit);
        }
      };
    },
  };
}
