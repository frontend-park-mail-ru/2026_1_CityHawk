import { getEvents } from '../../api/events.api.js';
import { getCategories } from '../../api/categories.api.js';
import { getMeOrNull } from '../../api/profile.api.js';
import { getHeaderUserDisplayName } from '../../components/header/header-user.js';
import { renderEventListCatalog } from '../../modules/events/event-list-catalog.js';
import { attachEventListFilters, renderEventListFilters } from '../../modules/events/event-list-filters.js';
import { renderTemplate } from '../../app/templates/renderer.js';

/** @typedef {import('../../types/router.js').RouteContext} RouteContext */
/** @typedef {import('../../types/router.js').RouteView} RouteView */

/**
 * Форматирует дату мероприятия в короткий текст.
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
 * Преобразует событие в карточку для каталога.
 *
 * @param {Record<string, any>} event
 * @returns {{ id: string, imageUrl: string, title: string, tags: string[], dateText: string, placeText: string }}
 */
function mapEventToCatalogCardViewModel(event = {}) {
  const tags = Array.isArray(event?.tags)
    ? event.tags.map((tag) => tag?.name || '').filter(Boolean)
    : [];
  const place = event?.nextSession?.place || {};
  const placeText = [place?.name, place?.addressLine].filter(Boolean).join(', ');

  return {
    id: event?.id || '',
    imageUrl: event?.coverImageUrl || '/public/static/img/concert.jpeg',
    title: event?.title || '',
    tags,
    dateText: formatEventDate(event?.nextSession?.startAt),
    placeText,
  };
}

/**
 * Возвращает заглушки каталога.
 *
 * @returns {{
 *   items: Array<Record<string, any>>,
 *   categories: Array<Record<string, any>>
 * }}
 */
function getFallbackCatalogData() {
  return {
    items: [
      {
        id: '',
        title: 'Futurione',
        coverImageUrl: '/public/static/img/futurione.jpeg',
        tags: [{ name: 'Digital' }, { name: 'Art' }],
        nextSession: {
          startAt: '2026-04-05T19:00:00Z',
          place: {
            name: 'ВДНХ',
            addressLine: '2-я Останкинская улица, 3',
          },
        },
      },
      {
        id: '',
        title: 'Женский стендап',
        coverImageUrl: '/public/static/img/standup.png',
        tags: [{ name: 'Comedy' }],
        nextSession: {
          startAt: '2026-04-07T18:30:00Z',
          place: {
            name: 'Live Арена',
            addressLine: 'Москва',
          },
        },
      },
      {
        id: '',
        title: 'Ледовое шоу Татьяны Навки',
        coverImageUrl: '/public/static/img/navka.jpeg',
        tags: [{ name: 'Show' }, { name: 'Ice' }],
        nextSession: {
          startAt: '2026-04-10T20:00:00Z',
          place: {
            name: 'Навка Арена',
            addressLine: 'Москва',
          },
        },
      },
      {
        id: '',
        title: 'Балет Щелкунчик',
        coverImageUrl: '/public/static/img/balet.jpg',
        tags: [{ name: 'Ballet' }],
        nextSession: {
          startAt: '2026-04-14T19:00:00Z',
          place: {
            name: 'Большой театр',
            addressLine: 'Театральная площадь, 1',
          },
        },
      },
    ],
    categories: [
      { id: 'concert', name: 'Концерты' },
      { id: 'show', name: 'Шоу' },
      { id: 'exhibition', name: 'Выставки' },
      { id: 'theatre', name: 'Театр' },
    ],
  };
}

/**
 * Возвращает query-параметры фильтров из URL.
 *
 * @returns {{ query: string, categoryId: string, datePreset: string, sort: string }}
 */
function getFilterStateFromLocation() {
  const params = new URLSearchParams(window.location.search);

  return {
    query: params.get('query') || '',
    categoryId: params.get('categoryId') || '',
    datePreset: params.get('datePreset') || '',
    sort: params.get('sort') || '',
  };
}

/**
 * Возвращает диапазон дат для выбранного пресета.
 *
 * @param {string} preset
 * @returns {{ dateFrom?: string, dateTo?: string }}
 */
function getDateRangeFromPreset(preset) {
  if (!preset) {
    return {};
  }

  const date = new Date();
  if (preset === 'tomorrow') {
    date.setDate(date.getDate() + 1);
  }

  const isoDate = date.toISOString().slice(0, 10);
  return {
    dateFrom: isoDate,
    dateTo: isoDate,
  };
}

/**
 * Страница списка событий.
 *
 * @param {RouteContext} options
 * @returns {Promise<RouteView>}
 */
export async function eventListPage({ navigate }) {
  const filters = getFilterStateFromLocation();
  const me = await getMeOrNull();
  const user = me
    ? {
      ...me,
      displayName: getHeaderUserDisplayName(me),
    }
    : null;

  let catalogData = getFallbackCatalogData();

  try {
    const dateRange = getDateRangeFromPreset(filters.datePreset);
    const [eventsResponse, categoriesResponse] = await Promise.all([
      getEvents({
        query: filters.query,
        categoryId: filters.categoryId,
        ...dateRange,
        sort: filters.sort,
        limit: 12,
        offset: 0,
      }),
      getCategories(),
    ]);

    catalogData = {
      items: Array.isArray(eventsResponse?.items) ? eventsResponse.items : [],
      categories: Array.isArray(categoriesResponse?.items) ? categoriesResponse.items : [],
    };
  } catch {
    catalogData = getFallbackCatalogData();
  }

  const cards = catalogData.items.map(mapEventToCatalogCardViewModel);
  const categoryOptions = catalogData.categories.map((category) => ({
    ...category,
    selected: String(category?.id || '') === String(filters.categoryId || ''),
  }));
  const datePresetOptions = [
    { value: 'today', label: 'Сегодня' },
    { value: 'tomorrow', label: 'Завтра' },
  ].map((option) => ({
    ...option,
    selected: option.value === filters.datePreset,
  }));
  const sortOptions = [
    { value: 'dateAsc', label: 'Сначала ближайшие' },
    { value: 'dateDesc', label: 'Сначала поздние' },
    { value: 'titleAsc', label: 'По названию А-Я' },
  ].map((option) => ({
    ...option,
    selected: option.value === filters.sort,
  }));
  const eventListFilters = renderEventListFilters({
    categories: categoryOptions,
    datePresetOptions,
    sortOptions,
  });
  const eventListCatalog = renderEventListCatalog({
    cards,
    hasCards: cards.length > 0,
  });
  const html = renderTemplate('event-list', {
    eventListFilters,
    eventListCatalog,
    user,
    headerSearch: { query: filters.query },
  });

  return {
    html,
    mount(root) {
      const headerSearchForm = root.querySelector('[data-role="header-search-form"]');
      const detachEventListFilters = attachEventListFilters(root, {
        onSubmit(form) {
          const formData = new FormData(form);
          const params = new URLSearchParams();
          const categoryId = String(formData.get('categoryId') || '').trim();
          const datePreset = String(formData.get('datePreset') || '').trim();
          const sort = String(formData.get('sort') || '').trim();

          if (filters.query) {
            params.set('query', filters.query);
          }
          if (categoryId) {
            params.set('categoryId', categoryId);
          }
          if (datePreset) {
            params.set('datePreset', datePreset);
          }
          if (sort) {
            params.set('sort', sort);
          }

          const suffix = params.toString() ? `?${params.toString()}` : '';
          navigate(`/events${suffix}`);
        },
      });

      const handleHeaderSearchSubmit = (event) => {
        event.preventDefault();

        const formData = new FormData(headerSearchForm);
        const params = new URLSearchParams(window.location.search);
        const query = String(formData.get('query') || '').trim();

        if (query) {
          params.set('query', query);
        } else {
          params.delete('query');
        }

        const suffix = params.toString() ? `?${params.toString()}` : '';
        navigate(`/events${suffix}`);
      };

      headerSearchForm?.addEventListener('submit', handleHeaderSearchSubmit);

      return () => {
        detachEventListFilters();
        headerSearchForm?.removeEventListener('submit', handleHeaderSearchSubmit);
      };
    },
  };
}
