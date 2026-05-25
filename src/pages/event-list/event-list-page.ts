import { getEvents } from '../../api/events.api.js';
import { getCategories } from '../../api/categories.api.js';
import { getTags } from '../../api/tags.api.js';
import { getMeOrNull } from '../../api/profile.api.js';
import { attachHeaderSearchSuggestions } from '../../components/header/header-search-suggestions.js';
import type { HeaderSearchSuggestion } from '../../components/header/header-search-suggestions.js';
import { attachHeaderCityPicker } from '../../components/header/header-city-picker.js';
import { getHeaderUserDisplayName } from '../../components/header/header-user.js';
import { localizeCategoryName } from '../../modules/events/common/category-localization.js';
import { renderEventListCatalog } from '../../modules/events/list/event-list-catalog.js';
import { attachEventListFilters, renderEventListFilters } from '../../modules/events/list/event-list-filters.js';
import { renderTemplate } from '../../app/templates/renderer.js';
import { formatEventDateOrPeriod } from '../../modules/events/common/event-date-label.js';
import { isVisibleEvent } from '../../modules/events/common/event-visibility.js';
import type { Category, EventCard, Tag, User } from '../../types/api.js';
import type { RouteContext, RouteView } from '../../types/router.js';

interface CatalogCardViewModel {
  id: string;
  imageUrl: string;
  title: string;
  tags: string[];
  dateText: string;
  placeText: string;
  isFavorite: boolean;
}

interface CatalogData {
  items: EventCard[];
  categories: Category[];
  tags: Tag[];
  total: number;
}

interface FilterState {
  query: string;
  city: string;
  cityId: string;
  categoryId: string;
  tagId: string;
  datePreset: string;
  sort: string;
  page: number;
}

interface PaginationItem {
  href?: string;
  label: string;
  active?: boolean;
  isGap?: boolean;
}

const EVENTS_PER_PAGE = 12;

function isUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

function mapEventToCatalogCardViewModel(event: Partial<EventCard> = {}): CatalogCardViewModel {
  const tags = Array.isArray(event.tags)
    ? event.tags.map((tag) => tag?.name || '').filter(Boolean)
    : [];
  const placeText = [
    event.nextSession?.placeName || event.nextSession?.place?.name,
    event.nextSession?.place?.addressLine,
  ].filter(Boolean).join(', ');

  return {
    id: event.id || '',
    imageUrl: event.coverImageUrl || '/public/static/img/concert.jpeg',
    title: event.title || '',
    tags,
    dateText: formatEventDateOrPeriod(event),
    placeText,
    isFavorite: Boolean(event.isFavorite),
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
    total: 4,
  };
}

function getFilterStateFromLocation(): FilterState {
  const params = new URLSearchParams(window.location.search);
  const rawCategoryId = params.get('categoryId') || '';
  const rawTagId = params.get('tagId') || '';
  const rawCityId = params.get('cityId') || '';
  const rawPage = Number(params.get('page') || '1');

  return {
    query: params.get('query') || '',
    city: params.get('city') || '',
    cityId: isUuid(rawCityId) ? rawCityId : '',
    categoryId: isUuid(rawCategoryId) ? rawCategoryId : '',
    tagId: rawTagId.trim(),
    datePreset: params.get('datePreset') || '',
    sort: params.get('sort') || '',
    page: Number.isFinite(rawPage) && rawPage > 0 ? Math.floor(rawPage) : 1,
  };
}

function buildEventListPath(filters: FilterState, overrides: Partial<FilterState> = {}): string {
  const next = { ...filters, ...overrides };
  const params = new URLSearchParams();

  if (next.query) {
    params.set('query', next.query);
  }
  if (next.cityId) {
    params.set('cityId', next.cityId);
  }
  if (next.city) {
    params.set('city', next.city);
  }
  if (next.categoryId) {
    params.set('categoryId', next.categoryId);
  }
  if (next.tagId) {
    params.set('tagId', next.tagId);
  }
  if (next.datePreset) {
    params.set('datePreset', next.datePreset);
  }
  if (next.sort) {
    params.set('sort', next.sort);
  }
  if (next.page > 1) {
    params.set('page', String(next.page));
  }

  const suffix = params.toString() ? `?${params.toString()}` : '';
  return `/events${suffix}`;
}

function buildPaginationItems(filters: FilterState, currentPage: number, totalPages: number): PaginationItem[] {
  if (totalPages <= 1) {
    return [];
  }

  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, index) => ({
      href: buildEventListPath(filters, { page: index + 1 }),
      label: String(index + 1),
      active: index + 1 === currentPage,
    }));
  }

  const pages = new Set<number>([1, totalPages, currentPage - 1, currentPage, currentPage + 1]);
  const normalized = Array.from(pages)
    .filter((page) => page >= 1 && page <= totalPages)
    .sort((a, b) => a - b);

  const items: PaginationItem[] = [];

  normalized.forEach((page, index) => {
    const previous = normalized[index - 1];

    if (previous && page - previous > 1) {
      items.push({
        label: '...',
        isGap: true,
      });
    }

    items.push({
      href: buildEventListPath(filters, { page }),
      label: String(page),
      active: page === currentPage,
    });
  });

  return items;
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
        limit: EVENTS_PER_PAGE,
        offset: (filters.page - 1) * EVENTS_PER_PAGE,
      }),
      getCategories(),
      getTags(),
    ]);

    const items = eventsResult.status === 'fulfilled' && Array.isArray(eventsResult.value?.items)
      ? eventsResult.value.items.filter(isVisibleEvent)
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
      total: eventsResult.status === 'fulfilled' ? Number(eventsResult.value?.total || items.length) : items.length,
    };
  } catch {
    catalogData = getFallbackCatalogData();
  }

  const cards = catalogData.items.map(mapEventToCatalogCardViewModel);
  const totalPages = Math.max(1, Math.ceil(catalogData.total / EVENTS_PER_PAGE));
  const currentPage = Math.min(filters.page, totalPages);
  const categoryOptions = catalogData.categories
    .filter((category) => isUuid(String(category.id || '')))
    .map((category) => ({
      value: category.id,
      label: localizeCategoryName(category),
      selected: String(category.id || '') === String(filters.categoryId || ''),
    }));
  const tagOptions = catalogData.tags
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
    currentPage,
    totalPages,
    prevHref: currentPage > 1 ? buildEventListPath(filters, { page: currentPage - 1 }) : '',
    nextHref: currentPage < totalPages ? buildEventListPath(filters, { page: currentPage + 1 }) : '',
    pages: buildPaginationItems(filters, currentPage, totalPages),
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
          if (tagId) {
            params.set('tagId', tagId);
          }
          if (datePreset) {
            params.set('datePreset', datePreset);
          }
          if (sort) {
            params.set('sort', sort);
          }

          navigate(buildEventListPath({
            query,
            city: currentCityName,
            cityId: currentCityId && isUuid(currentCityId) ? currentCityId : '',
            categoryId: categoryId && isUuid(categoryId) ? categoryId : '',
            tagId,
            datePreset,
            sort,
            page: 1,
          }));
        },
      });

      const navigateByHeaderQuery = (nextQuery: string, suggestion?: HeaderSearchSuggestion) => {
        const params = new URLSearchParams(window.location.search);
        const type = String(suggestion?.type || '').trim().toLowerCase();
        const suggestionID = String(suggestion?.id || '').trim();

        if (nextQuery) {
          params.set('query', nextQuery);
        } else {
          params.delete('query');
        }

        if (isUuid(suggestionID) && (type === 'category' || type === 'категория')) {
          params.set('categoryId', suggestionID);
          params.delete('tagId');
        } else if (suggestionID && (type === 'tag' || type === 'тег')) {
          params.set('tagId', suggestionID);
          params.delete('categoryId');
        }

        navigate(buildEventListPath({
          query: String(params.get('query') || '').trim(),
          city: String(params.get('city') || '').trim(),
          cityId: String(params.get('cityId') || '').trim(),
          categoryId: String(params.get('categoryId') || '').trim(),
          tagId: String(params.get('tagId') || '').trim(),
          datePreset: String(params.get('datePreset') || '').trim(),
          sort: String(params.get('sort') || '').trim(),
          page: 1,
        }));
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
          onPick(query, suggestion) {
            navigateByHeaderQuery(query, suggestion);
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
