import { getEventById, getEvents } from '../../api/events.api.js';
import { getMe } from '../../api/profile.api.js';
import { renderTemplate } from '../../app/templates/renderer.js';
import { renderEventDescription, attachEventDescription } from '../../modules/events/event-description.js';
import { renderEventGallery } from '../../modules/events/event-gallery.js';
import { renderEventHero } from '../../modules/events/event-hero.js';
import { renderEventLocation } from '../../modules/events/event-location.js';
import { renderEventRecommendations } from '../../modules/events/event-recommendations.js';
import { getAccessToken } from '../../modules/session/session.store.js';

/**
 * Возвращает короткое имя пользователя по email.
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
 * Форматирует дату мероприятия в короткий текст.
 *
 * @param {string | null | undefined} value
 * @returns {string}
 */
function formatEventDate(value) {
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

/**
 * Подготавливает массив картинок для галереи.
 *
 * @param {any} rawEvent
 * @returns {Array<{ imageUrl: string, alt: string }>}
 */
function mapEventImagesToGalleryViewModel(rawEvent) {
  const images = Array.isArray(rawEvent?.images) ? rawEvent.images : [];
  const title = rawEvent?.title || 'Мероприятие';

  if (images.length > 0) {
    return images.slice(0, 4).map((item, index) => ({
      imageUrl: item?.imageUrl || item?.url || '',
      alt: item?.alt || `${title} — кадр ${index + 1}`,
    }));
  }

  return [
    { imageUrl: '/public/static/img/futurione.jpeg', alt: `${title} — постер` },
    { imageUrl: '/public/static/img/photo.jpeg', alt: `${title} — атмосфера` },
    { imageUrl: '/public/static/img/art.png', alt: `${title} — детали` },
    { imageUrl: '/public/static/img/concert.jpeg', alt: `${title} — площадка` },
  ];
}

/**
 * Преобразует полную информацию о мероприятии в формат для модулей страницы.
 *
 * @param {any} rawEvent
 * @returns {{
 *   category: string,
 *   title: string,
 *   dateText: string,
 *   placeText: string,
 *   posterUrl: string,
 *   leadText: string,
 *   paragraphs: string[],
 *   locationParagraphs: string[],
 *   mapImageUrl: string,
 *   mapAlt: string
 * }}
 */
function mapEventDetailsToPageViewModel(rawEvent = {}) {
  const firstSession = Array.isArray(rawEvent?.sessions) ? rawEvent.sessions[0] : null;
  const place = firstSession?.place || rawEvent?.place || {};
  const title = rawEvent?.title || 'Futurione';
  const description = rawEvent?.fullDescription || '';
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
    place?.city?.name || rawEvent?.city?.name,
  ].filter(Boolean);
  const categories = Array.isArray(rawEvent?.categories) ? rawEvent.categories : [];
  const legacyCategoryName = rawEvent?.category?.name || '';
  const category = categories[0]?.name || legacyCategoryName || 'Мероприятие';
  const galleryImages = mapEventImagesToGalleryViewModel(rawEvent);

  return {
    category,
    title,
    dateText: formatEventDate(firstSession?.startAt || rawEvent?.dateText),
    placeText: locationParts.join(', ') || 'Локация уточняется',
    posterUrl: rawEvent?.coverImageUrl || rawEvent?.imageUrl || galleryImages[0].imageUrl,
    leadText: rawEvent?.shortDescription || 'Актуальная информация о событии, времени и формате посещения.',
    paragraphs: safeParagraphs,
    locationParagraphs: [
      locationParts.join(', ') || 'Адрес будет добавлен позже.',
      place?.description || 'Подробная навигация и ориентиры для посетителей появятся после интеграции с backend.',
    ],
    galleryImages,
    mapImageUrl: '/public/static/img/photo.jpeg',
    mapAlt: `Карта для ${title}`,
  };
}

/**
 * Возвращает fallback-данные страницы мероприятия.
 *
 * @param {string} eventId
 * @returns {any}
 */
function getFallbackEvent(eventId) {
  return {
    id: eventId,
    title: 'Futurione',
    shortDescription: 'Фиджитал-пространство, где искусство и цифровые технологии создают новый зрительский опыт.',
    fullDescription: [
      'Погрузитесь в уникальное цифровое арт-пространство Futurione — место, где искусство переплетается с технологиями будущего, а каждый шаг дарит новые яркие впечатления.',
      'Каждый зал Futurione — это отдельная вселенная: от футуристичных тоннелей и световых коридоров до погружения в живые цифровые леса и абстрактные пространства.',
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
          description: 'Ориентир — колесо обозрения «Солнце Москвы». Вход в пространство расположен у основания комплекса.',
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

/**
 * Преобразует событие из списка в карточку рекомендации.
 *
 * @param {any} item
 * @returns {{ id: string, imageUrl: string, title: string, description: string, tags: string[] }}
 */
function mapEventToRecommendationViewModel(item = {}) {
  const place = item?.nextSession?.place || {};
  const placeParts = [place?.name, place?.addressLine].filter(Boolean);
  const dateText = formatEventDate(item?.nextSession?.startAt);
  const placeText = placeParts.join(', ');
  const tags = Array.isArray(item?.tags)
    ? item.tags
      .map((tag) => tag?.name || '')
      .filter(Boolean)
    : [];

  return {
    id: item?.id || '',
    imageUrl: item?.coverImageUrl || '/public/static/img/concert.jpeg',
    title: item?.title || 'Мероприятие',
    description: [dateText, placeText].filter(Boolean).join(' · ') || 'Подробности скоро появятся',
    tags,
  };
}

/**
 * Подготавливает список рекомендаций для страницы мероприятия.
 *
 * @param {any} response
 * @param {string} currentEventId
 * @returns {Array<{ id: string, imageUrl: string, title: string, description: string }>}
 */
function mapRecommendationsToViewModel(response, currentEventId) {
  const items = Array.isArray(response?.items) ? response.items : [];

  const normalized = items
    .filter((item) => String(item?.id || '') !== String(currentEventId))
    .slice(0, 4)
    .map(mapEventToRecommendationViewModel);

  if (normalized.length > 0) {
    return normalized;
  }

  return [
    {
      id: 'standup',
      imageUrl: '/public/static/img/standup.png',
      title: 'Женский стендап',
      description: '27 марта · Live Арена, Москва',
      tags: ['Comedy'],
    },
    {
      id: 'navka',
      imageUrl: '/public/static/img/navka.jpeg',
      title: 'Ледовое шоу Татьяны Навки',
      description: '10 февраля · Навка Арена, Москва',
      tags: ['Show', 'Ice'],
    },
    {
      id: 'balet',
      imageUrl: '/public/static/img/balet.jpg',
      title: 'Балет Щелкунчик',
      description: '14 марта · Большой театр, Москва',
      tags: ['Ballet'],
    },
    {
      id: 'concert',
      imageUrl: '/public/static/img/concert.jpeg',
      title: 'Вечерний концерт',
      description: 'Суббота · Центр города',
      tags: ['Music'],
    },
  ];
}

/**
 * Создаёт представление страницы мероприятия.
 *
 * @param {{ navigate: (path: string, options?: { replace?: boolean }) => void, params?: Record<string, string> }} options
 * @returns {Promise<{ html: string, mount(root: HTMLElement): (() => void) }>}
 */
export async function eventPage({ navigate, params = {} }) {
  // 1. Получить eventId из params.
  const eventId = params.eventId || 'demo-event';
  const headerQuery = new URLSearchParams(window.location.search).get('query') || '';

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

  // 2. Загрузить getEventById(eventId) и сохранить rawEvent.
  let rawEvent = getFallbackEvent(eventId);

  try {
    rawEvent = await getEventById(eventId);
  } catch {
    rawEvent = getFallbackEvent(eventId);
  }

  // 3. Загрузить getEvents() для рекомендаций.
  let recommendations = [];

  try {
    const response = await getEvents({ limit: 4 });
    recommendations = mapRecommendationsToViewModel(response, eventId);
  } catch {
    recommendations = mapRecommendationsToViewModel(null, eventId);
  }

  // 4. Получить view-model для страницы.
  const event = mapEventDetailsToPageViewModel(rawEvent);

  // 5. Собрать html страницы из модулей.
  const html = renderTemplate('event', {
    headerSearch: { query: headerQuery },
    eventHero: renderEventHero({
      category: event.category,
      title: event.title,
      dateText: event.dateText,
      placeText: event.placeText,
      posterUrl: event.posterUrl,
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
    // 6. Подключить mount.
    mount(root) {
      const headerSearchForm = root.querySelector('[data-role="header-search-form"]');

      attachEventDescription(root);

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

      return () => {
        headerSearchForm?.removeEventListener('submit', handleHeaderSearchSubmit);
      };
    },
  };
}
