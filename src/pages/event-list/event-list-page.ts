import { getEvents } from '../../api/events.api.js';
import { getTags } from '../../api/tags.api.js';
import { getMeOrNull } from '../../api/profile.api.js';
import { attachHeaderSearchSuggestions } from '../../components/header/header-search-suggestions.js';
import { attachHeaderCityPicker } from '../../components/header/header-city-picker.js';
import { getHeaderUserDisplayName } from '../../components/header/header-user.js';
import { renderEventListCatalog } from '../../modules/events/list/event-list-catalog.js';
import {
  attachEventListFilters,
  renderEventListFilters,
  type TagGroupFilter,
} from '../../modules/events/list/event-list-filters.js';
import { renderTemplate } from '../../app/templates/renderer.js';
import { formatEventDateOrPeriod } from '../../modules/events/common/event-date-label.js';
import { isVisibleEvent } from '../../modules/events/common/event-visibility.js';
import type { EventCard, Tag, User } from '../../types/api.js';
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
  tags: Tag[];
  total: number;
}

interface FilterState {
  query: string;
  city: string;
  cityId: string;
  tagId: string;
  page: number;
}

interface PaginationItem {
  href?: string;
  label: string;
  active?: boolean;
  isGap?: boolean;
}

const EVENTS_PER_PAGE = 12;
const TAG_GROUPS: Record<string, string> = {
  format: 'Чем заняться',
  genre: 'Тематика',
  mood: 'Вайб',
  audience: 'Для кого',
  price: 'По бюджету',
};

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
  ].filter(Boolean).join(', ') || [
    event.placeName || event.place?.name,
    event.place?.addressLine,
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
    tags: [
      { id: '11111111-1111-4111-8111-111111111111', name: 'Кино', slug: 'kino', group: 'format' },
      { id: '22222222-2222-4222-8222-222222222222', name: 'Комедия', slug: 'comedy', group: 'genre' },
      { id: '33333333-3333-4333-8333-333333333333', name: 'Свидание', slug: 'date', group: 'mood' },
    ],
    total: 4,
  };
}

function getFilterStateFromLocation(): FilterState {
  const params = new URLSearchParams(window.location.search);
  const rawTagId = params.get('tagId') || '';
  const rawCityId = params.get('cityId') || '';
  const rawPage = Number(params.get('page') || '1');

  return {
    query: params.get('query') || '',
    city: params.get('city') || '',
    cityId: isUuid(rawCityId) ? rawCityId : '',
    tagId: rawTagId.trim(),
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
  if (next.tagId) {
    params.set('tagId', next.tagId);
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
    const [eventsResult, tagsResult] = await Promise.allSettled([
      getEvents({
        query: filters.query,
        cityId: filters.cityId,
        tagId: filters.tagId,
        limit: EVENTS_PER_PAGE,
        offset: (filters.page - 1) * EVENTS_PER_PAGE,
      }),
      getTags(),
    ]);

    const items = eventsResult.status === 'fulfilled' && Array.isArray(eventsResult.value?.items)
      ? eventsResult.value.items.filter(isVisibleEvent)
      : catalogData.items;
    const tags = tagsResult.status === 'fulfilled'
      && Array.isArray(tagsResult.value?.items)
      ? tagsResult.value.items
      : catalogData.tags;

    catalogData = {
      items,
      tags,
      total: eventsResult.status === 'fulfilled' ? Number(eventsResult.value?.total || items.length) : items.length,
    };
  } catch {
    catalogData = getFallbackCatalogData();
  }

  const cards = catalogData.items.map(mapEventToCatalogCardViewModel);
  const totalPages = Math.max(1, Math.ceil(catalogData.total / EVENTS_PER_PAGE));
  const currentPage = Math.min(filters.page, totalPages);
  const tagGroupFilters: TagGroupFilter[] = Object.entries(TAG_GROUPS)
    .map(([groupKey, groupLabel]) => {
      const options = catalogData.tags
        .filter((tag) => String(tag.group || '').trim() === groupKey)
        .map((tag) => ({
          value: String(tag.id || ''),
          label: String(tag.name || ''),
          selected: String(tag.id || '') === String(filters.tagId || ''),
        }));

      if (!options.length) {
        return null;
      }

      return {
        key: groupKey,
        label: groupLabel,
        fieldName: `tagGroup-${groupKey}`,
        options,
      } satisfies TagGroupFilter;
    })
    .filter((item): item is TagGroupFilter => Boolean(item));

  const eventListFilters = renderEventListFilters({
    tagGroups: tagGroupFilters,
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
        onChange(form, target) {
          const formData = new FormData(form);
          const currentParams = new URLSearchParams(window.location.search);
          const currentCityId = String(currentParams.get('cityId') || '').trim();
          const currentCityName = String(currentParams.get('city') || '').trim();
          const targetName = String(target.name || '').trim();
          const tagId = targetName
            ? String(formData.get(targetName) || '').trim()
            : '';

          const query = getCurrentQuery();

          navigate(buildEventListPath({
            query,
            city: currentCityName,
            cityId: currentCityId && isUuid(currentCityId) ? currentCityId : '',
            tagId,
            page: 1,
          }));
        },
      });

      const navigateByHeaderQuery = (nextQuery: string) => {
        const currentParams = new URLSearchParams(window.location.search);
        navigate(buildEventListPath({
          query: nextQuery,
          city: String(currentParams.get('city') || '').trim(),
          cityId: String(currentParams.get('cityId') || '').trim(),
          tagId: String(currentParams.get('tagId') || '').trim(),
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
