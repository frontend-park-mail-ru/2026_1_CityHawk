import { getEvents } from '../../api/events.api.js';
import { getCategories } from '../../api/categories.api.js';
import { getMeOrNull } from '../../api/profile.api.js';
import { getHeaderUserDisplayName } from '../../components/header/header-user.js';
import { renderEventListCatalog } from '../../modules/events/event-list-catalog.js';
import { attachEventListFilters, renderEventListFilters } from '../../modules/events/event-list-filters.js';
import { renderTemplate } from '../../app/templates/renderer.js';
import type { Category, EventCard, User } from '../../types/api.js';
import type { RouteContext, RouteView } from '../../types/router.js';

interface CatalogCardViewModel {
  id: string;
  imageUrl: string;
  title: string;
  tags: string[];
  dateText: string;
  placeText: string;
}

interface CatalogData {
  items: EventCard[];
  categories: Category[];
}

interface FilterState {
  query: string;
  categoryId: string;
  datePreset: string;
  sort: string;
}

function isUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
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

function mapEventToCatalogCardViewModel(event: Partial<EventCard> = {}): CatalogCardViewModel {
  const tags = Array.isArray(event.tags)
    ? event.tags.map((tag) => tag?.name || '').filter(Boolean)
    : [];
  const placeText = [
    event.nextSession?.place?.name,
    event.nextSession?.place?.addressLine,
  ].filter(Boolean).join(', ');

  return {
    id: event.id || '',
    imageUrl: event.coverImageUrl || '/public/static/img/concert.jpeg',
    title: event.title || '',
    tags,
    dateText: formatEventDate(event.nextSession?.startAt),
    placeText,
  };
}

function getFallbackCatalogData(): CatalogData {
  return {
    items: [
      {
        id: '',
        title: 'Futurione',
        coverImageUrl: '/public/static/img/futurione.jpeg',
        tags: [{ id: 'digital', name: 'Digital', slug: 'digital' }, { id: 'art', name: 'Art', slug: 'art' }],
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
        tags: [{ id: 'comedy', name: 'Comedy', slug: 'comedy' }],
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
        tags: [{ id: 'show', name: 'Show', slug: 'show' }, { id: 'ice', name: 'Ice', slug: 'ice' }],
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
        tags: [{ id: 'ballet', name: 'Ballet', slug: 'ballet' }],
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
      { id: 'concert', name: 'Концерты', slug: 'concert' },
      { id: 'show', name: 'Шоу', slug: 'show' },
      { id: 'exhibition', name: 'Выставки', slug: 'exhibition' },
      { id: 'theatre', name: 'Театр', slug: 'theatre' },
    ],
  };
}

function getFilterStateFromLocation(): FilterState {
  const params = new URLSearchParams(window.location.search);
  const rawCategoryId = params.get('categoryId') || '';

  return {
    query: params.get('query') || '',
    categoryId: isUuid(rawCategoryId) ? rawCategoryId : '',
    datePreset: params.get('datePreset') || '',
    sort: params.get('sort') || '',
  };
}

function getDateRangeFromPreset(preset: string): { dateFrom?: string; dateTo?: string } {
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

export async function eventListPage({ navigate }: RouteContext): Promise<RouteView> {
  const filters = getFilterStateFromLocation();
  const me = await getMeOrNull();
  const user: (User & { displayName: string }) | null = me
    ? {
      ...me,
      displayName: getHeaderUserDisplayName(me),
    }
    : null;

  let catalogData = getFallbackCatalogData();

  try {
    const dateRange = getDateRangeFromPreset(filters.datePreset);
    const [eventsResult, categoriesResult] = await Promise.allSettled([
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

    const items = eventsResult.status === 'fulfilled' && Array.isArray(eventsResult.value?.items)
      ? eventsResult.value.items
      : catalogData.items;
    const categories = categoriesResult.status === 'fulfilled'
      && Array.isArray(categoriesResult.value?.items)
      ? categoriesResult.value.items
      : catalogData.categories;

    catalogData = {
      items,
      categories,
    };
  } catch {
    catalogData = getFallbackCatalogData();
  }

  const cards = catalogData.items.map(mapEventToCatalogCardViewModel);
  const categoryOptions = catalogData.categories
    .filter((category) => isUuid(String(category.id || '')))
    .map((category) => ({
      value: category.id,
      label: category.name,
      selected: String(category.id || '') === String(filters.categoryId || ''),
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
          if (categoryId && isUuid(categoryId)) {
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

      const handleHeaderSearchSubmit = (event: SubmitEvent) => {
        event.preventDefault();

        if (!(headerSearchForm instanceof HTMLFormElement)) {
          return;
        }

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

      if (headerSearchForm instanceof HTMLFormElement) {
        headerSearchForm.addEventListener('submit', handleHeaderSearchSubmit);
      }

      return () => {
        detachEventListFilters();

        if (headerSearchForm instanceof HTMLFormElement) {
          headerSearchForm.removeEventListener('submit', handleHeaderSearchSubmit);
        }
      };
    },
  };
}
