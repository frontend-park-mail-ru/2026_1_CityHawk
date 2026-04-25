import { getEvents } from '../../api/events.api.js';
import { getCategories } from '../../api/categories.api.js';
import { getTags } from '../../api/tags.api.js';
import { getMeOrNull } from '../../api/profile.api.js';
import { attachHeaderSearchSuggestions } from '../../components/header/header-search-suggestions.js';
import { attachHeaderCityPicker } from '../../components/header/header-city-picker.js';
import { getHeaderUserDisplayName } from '../../components/header/header-user.js';
import { localizeCategoryName } from '../../modules/events/common/category-localization.js';
import { renderEventListCatalog } from '../../modules/events/list/event-list-catalog.js';
import { attachEventListFilters, renderEventListFilters } from '../../modules/events/list/event-list-filters.js';
import { renderTemplate } from '../../app/templates/renderer.js';
import type { Category, EventCard, Tag, User } from '../../types/api.js';
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
  tags: Tag[];
}

interface FilterState {
  query: string;
  cityId: string;
  categoryId: string;
  tagId: string;
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
    tags: [
      { id: '11111111-1111-4111-8111-111111111111', name: 'Комедия', slug: 'comedy' },
      { id: '22222222-2222-4222-8222-222222222222', name: 'Для детей', slug: 'kids' },
      { id: '33333333-3333-4333-8333-333333333333', name: 'Шоу', slug: 'show' },
    ],
  };
}

function getFilterStateFromLocation(): FilterState {
  const params = new URLSearchParams(window.location.search);
  const rawCategoryId = params.get('categoryId') || '';
  const rawTagId = params.get('tagId') || '';
  const rawCityId = params.get('cityId') || '';

  return {
    query: params.get('query') || '',
    cityId: isUuid(rawCityId) ? rawCityId : '',
    categoryId: isUuid(rawCategoryId) ? rawCategoryId : '',
    tagId: isUuid(rawTagId) ? rawTagId : '',
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
    const [eventsResult, categoriesResult, tagsResult] = await Promise.allSettled([
      getEvents({
        query: filters.query,
        cityId: filters.cityId,
        categoryId: filters.categoryId,
        tagId: filters.tagId,
        ...dateRange,
        sort: filters.sort,
        limit: 12,
        offset: 0,
      }),
      getCategories(),
      getTags(),
    ]);

    const items = eventsResult.status === 'fulfilled' && Array.isArray(eventsResult.value?.items)
      ? eventsResult.value.items
      : catalogData.items;
    const categories = categoriesResult.status === 'fulfilled'
      && Array.isArray(categoriesResult.value?.items)
      ? categoriesResult.value.items
      : catalogData.categories;
    const tags = tagsResult.status === 'fulfilled'
      && Array.isArray(tagsResult.value?.items)
      ? tagsResult.value.items
      : catalogData.tags;

    catalogData = {
      items,
      categories,
      tags,
    };
  } catch {
    catalogData = getFallbackCatalogData();
  }

  const cards = catalogData.items.map(mapEventToCatalogCardViewModel);
  const categoryOptions = catalogData.categories
    .filter((category) => isUuid(String(category.id || '')))
    .map((category) => ({
      value: category.id,
      label: localizeCategoryName(category),
      selected: String(category.id || '') === String(filters.categoryId || ''),
    }));
  const tagOptions = catalogData.tags
    .filter((tag) => isUuid(String(tag.id || '')))
    .map((tag) => ({
      value: String(tag.id || ''),
      label: String(tag.name || ''),
      selected: String(tag.id || '') === String(filters.tagId || ''),
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
    tags: tagOptions,
    datePresetOptions,
    sortOptions,
  });
  const eventListCatalog = renderEventListCatalog({
    cards,
    hasCards: cards.length > 0,
    canCreateEvent: Boolean(user),
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
      const detachCityPicker = attachHeaderCityPicker(root, { navigate });
      const getCurrentQuery = () => String(new URLSearchParams(window.location.search).get('query') || '').trim();

      if (headerSearchForm instanceof HTMLFormElement) {
        const queryInput = headerSearchForm.querySelector<HTMLInputElement>('input[name="query"]');
        if (queryInput instanceof HTMLInputElement) {
          queryInput.value = getCurrentQuery();
        }
      }

      const detachEventListFilters = attachEventListFilters(root, {
        onChange(form) {
          const formData = new FormData(form);
          const params = new URLSearchParams();
          const categoryId = String(formData.get('categoryId') || '').trim();
          const tagId = String(formData.get('tagId') || '').trim();
          const datePreset = String(formData.get('datePreset') || '').trim();
          const sort = String(formData.get('sort') || '').trim();
          const currentParams = new URLSearchParams(window.location.search);
          const currentCityId = String(currentParams.get('cityId') || '').trim();
          const currentCityName = String(currentParams.get('city') || '').trim();

          const query = getCurrentQuery();
          if (query) {
            params.set('query', query);
          }
          if (currentCityId && isUuid(currentCityId)) {
            params.set('cityId', currentCityId);
          }
          if (currentCityName) {
            params.set('city', currentCityName);
          }
          if (categoryId && isUuid(categoryId)) {
            params.set('categoryId', categoryId);
          }
          if (tagId && isUuid(tagId)) {
            params.set('tagId', tagId);
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

      const navigateByHeaderQuery = (nextQuery: string) => {
        const params = new URLSearchParams(window.location.search);

        if (nextQuery) {
          params.set('query', nextQuery);
        } else {
          params.delete('query');
        }

        const suffix = params.toString() ? '?' + params.toString() : '';
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
        detachCityPicker();
        detachEventListFilters();
        detachHeaderSuggestions();

        if (headerSearchForm instanceof HTMLFormElement) {
          headerSearchForm.removeEventListener('submit', handleHeaderSearchSubmit);
        }
      };
    },
  };
}
