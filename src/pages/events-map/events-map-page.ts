import './events-map-page.css';
import '../../modules/events-map/events-map-canvas.css';
import '../../modules/events-map/events-mood-sidebar.css';
import { getEvents } from '../../api/events.api.js';
import { getMeOrNull } from '../../api/profile.api.js';
import { attachHeaderCityPicker } from '../../components/header/header-city-picker.js';
import { attachHeaderSearchSuggestions } from '../../components/header/header-search-suggestions.js';
import { getHeaderUserDisplayName } from '../../components/header/header-user.js';
import { renderTemplate } from '../../app/templates/renderer.js';
import {
  attachEventsMapCanvas,
  renderEventsMapCanvas,
  type EventsMapFilterOption,
  type EventsMapPin,
} from '../../modules/events-map/events-map-canvas.js';
import { renderEventsMapMoodSidebar } from '../../modules/events-map/events-mood-sidebar.js';
import type { EventCard, Tag, User } from '../../types/api.js';
import type { RouteContext, RouteView } from '../../types/router.js';

type SortValue = 'popular' | 'name';
type FilterSelectName = 'district' | 'style' | 'season' | 'sort';

interface FilterState {
  query: string;
  district: string;
  style: string;
  season: string;
  sort: SortValue;
  active: string;
  cityId: string;
}

interface MapSpot {
  id: string;
  title: string;
  imageUrl: string;
  address: string;
  district: string;
  districtLabel: string;
  style: string;
  styleLabel: string;
  season: string;
  seasonLabel: string;
  popularity: number;
  latitude: number;
  longitude: number;
}

interface MoodCard {
  title: string;
  imageUrl: string;
  href: string;
}

const ROUTE_PATH = '/events-map';
const FALLBACK_MOOD_IMAGES = [
  '/public/static/img/photo.jpeg',
  '/public/static/img/futurione.jpeg',
  '/public/static/img/art.png',
  '/public/static/img/concert.jpeg',
  '/public/static/img/navka.jpeg',
];

function getFilterStateFromLocation(): FilterState {
  const params = new URLSearchParams(window.location.search);
  const rawSort = String(params.get('sort') || '').trim();

  return {
    query: String(params.get('query') || '').trim(),
    district: String(params.get('district') || '').trim(),
    style: String(params.get('style') || '').trim(),
    season: String(params.get('season') || '').trim(),
    sort: rawSort === 'name' ? 'name' : 'popular',
    active: String(params.get('active') || '').trim(),
    cityId: String(params.get('cityId') || '').trim(),
  };
}

function buildPagePath(updates: Record<string, string | null | undefined>): string {
  const params = new URLSearchParams(window.location.search);

  Object.entries(updates).forEach(([key, value]) => {
    const normalized = String(value || '').trim();
    if (normalized) {
      params.set(key, normalized);
    } else {
      params.delete(key);
    }
  });

  const suffix = params.toString() ? `?${params.toString()}` : '';
  return `${ROUTE_PATH}${suffix}`;
}

function toNumber(value: unknown): number | null {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function resolveSeason(value: string): { value: string; label: string } {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return { value: 'all', label: 'Круглый год' };
  }

  const month = date.getMonth() + 1;
  if (month === 12 || month <= 2) {
    return { value: 'winter', label: 'Зима' };
  }
  if (month >= 3 && month <= 5) {
    return { value: 'spring', label: 'Весна' };
  }
  if (month >= 6 && month <= 8) {
    return { value: 'summer', label: 'Лето' };
  }
  return { value: 'autumn', label: 'Осень' };
}

function normalizeStyle(tag?: Tag | null): { value: string; label: string } {
  const value = String(tag?.id || '').trim();
  const label = String(tag?.name || '').trim();
  return {
    value: value || 'other',
    label: label || 'Без тега',
  };
}

function extractMapSpot(event: EventCard, index: number): MapSpot | null {
  const source = event as unknown as Record<string, unknown>;
  const sessions = Array.isArray(source.sessions) ? source.sessions : [];
  const firstSession = sessions[0] as Record<string, unknown> | undefined;
  const sessionPlace = firstSession?.place as Record<string, unknown> | undefined;
  const nextSession = source.nextSession as Record<string, unknown> | undefined;
  const nextSessionPlace = nextSession?.place as Record<string, unknown> | undefined;

  const latitude = toNumber(sessionPlace?.latitude) ?? toNumber(nextSessionPlace?.latitude);
  const longitude = toNumber(sessionPlace?.longitude) ?? toNumber(nextSessionPlace?.longitude);

  if (latitude === null || longitude === null) {
    console.debug('[events-map] skip event without coords', {
      eventId: event.id,
      title: event.title,
      latitude: sessionPlace?.latitude,
      longitude: sessionPlace?.longitude,
    });
    return null;
  }

  const citySource = sessionPlace?.city ?? nextSessionPlace?.city;
  const cityName = String(citySource && typeof citySource === 'object'
    ? ((citySource as Record<string, unknown>).name || '')
    : '').trim();
  const placeName = String(sessionPlace?.name || nextSessionPlace?.name || '').trim();
  const address = String(sessionPlace?.addressLine || nextSessionPlace?.addressLine || '').trim();
  const season = resolveSeason(String(firstSession?.startAt || event.nextSession?.startAt || ''));
  const style = normalizeStyle(Array.isArray(event.tags) ? event.tags[0] : null);

  return {
    id: String(event.id || '').trim(),
    title: String(event.title || '').trim() || 'Без названия',
    imageUrl: String(event.coverImageUrl || '').trim() || '/public/static/img/photo.jpeg',
    address: [placeName, address].filter(Boolean).join(', ') || 'Адрес не указан',
    district: cityName.toLowerCase() || 'other',
    districtLabel: cityName || 'Другой город',
    style: style.value,
    styleLabel: style.label,
    season: season.value,
    seasonLabel: season.label,
    popularity: Math.max(1, 1000 - index),
    latitude,
    longitude,
  };
}

function matchesFilters(spot: MapSpot, filters: FilterState): boolean {
  if (filters.district && spot.district !== filters.district) {
    return false;
  }

  if (filters.style && spot.style !== filters.style) {
    return false;
  }

  if (filters.season && spot.season !== filters.season) {
    return false;
  }

  if (!filters.query) {
    return true;
  }

  const haystack = [
    spot.title,
    spot.address,
    spot.districtLabel,
    spot.styleLabel,
    spot.seasonLabel,
  ].join(' ').toLowerCase();

  return haystack.includes(filters.query.toLowerCase());
}

function sortSpots(items: MapSpot[], sort: SortValue): MapSpot[] {
  const normalized = [...items];

  if (sort === 'name') {
    return normalized.sort((a, b) => a.title.localeCompare(b.title, 'ru'));
  }

  return normalized.sort((a, b) => b.popularity - a.popularity);
}

function buildOptions(
  spots: MapSpot[],
  key: 'district' | 'style' | 'season',
  selectedValue: string,
): EventsMapFilterOption[] {
  const source = new Map<string, string>();

  spots.forEach((spot) => {
    if (key === 'district') {
      source.set(spot.district, spot.districtLabel);
      return;
    }

    if (key === 'style') {
      source.set(spot.style, spot.styleLabel);
      return;
    }

    source.set(spot.season, spot.seasonLabel);
  });

  return Array.from(source.entries())
    .map(([value, label]) => ({
      value,
      label,
      selected: value === selectedValue,
    }))
    .sort((a, b) => a.label.localeCompare(b.label, 'ru'));
}

function resolveMoodHeading(filters: FilterState): string {
  if (filters.style) {
    return 'Подборка по тегу';
  }

  if (filters.season) {
    return 'Подборка по сезону';
  }

  return 'Подборки';
}

function buildMoodCards(spots: MapSpot[]): MoodCard[] {
  const stats = new Map<string, { title: string; count: number; imageUrl: string }>();

  spots.forEach((spot) => {
    const entry = stats.get(spot.style);
    if (entry) {
      entry.count += 1;
      if (!entry.imageUrl && spot.imageUrl) {
        entry.imageUrl = spot.imageUrl;
      }
      return;
    }

    stats.set(spot.style, {
      title: spot.styleLabel,
      count: 1,
      imageUrl: spot.imageUrl,
    });
  });

  const cards = Array.from(stats.entries())
    .sort((a, b) => b[1].count - a[1].count || a[1].title.localeCompare(b[1].title, 'ru'))
    .slice(0, 5)
    .map(([style, value], index) => ({
      title: value.title,
      imageUrl: value.imageUrl || FALLBACK_MOOD_IMAGES[index % FALLBACK_MOOD_IMAGES.length],
      href: `${ROUTE_PATH}?style=${encodeURIComponent(style)}`,
    }));

  return cards;
}

export async function eventsMapPage({ navigate }: RouteContext): Promise<RouteView> {
  const filters = getFilterStateFromLocation();
  console.debug('[events-map] enter page', {
    path: window.location.pathname,
    search: window.location.search,
    filters,
  });
  const me = await getMeOrNull().catch(() => null);
  const user: (User & { displayName: string }) | null = me
    ? {
      ...me,
      displayName: getHeaderUserDisplayName(me),
    }
    : null;

  const response = await getEvents({
    query: filters.query || undefined,
    cityId: filters.cityId || undefined,
    limit: 200,
    offset: 0,
  }).catch((error) => {
    console.debug('[events-map] getEvents failed', error);
    return { items: [], total: 0, limit: 0, offset: 0 };
  });
  console.debug('[events-map] getEvents response', {
    total: response.total,
    limit: response.limit,
    offset: response.offset,
    itemsCount: Array.isArray(response.items) ? response.items.length : 0,
  });

  const allSpots = (Array.isArray(response.items) ? response.items : [])
    .map((event, index) => extractMapSpot(event, index))
    .filter((spot): spot is MapSpot => Boolean(spot));

  const filtered = sortSpots(allSpots.filter((spot) => matchesFilters(spot, filters)), filters.sort);
  console.debug('[events-map] mapped spots', {
    allSpots: allSpots.length,
    filteredSpots: filtered.length,
    sort: filters.sort,
  });
  const activeId = filtered.some((spot) => spot.id === filters.active)
    ? filters.active
    : (filtered[0]?.id || '');

  const pins: EventsMapPin[] = filtered.map((spot) => ({
    id: spot.id,
    title: spot.title,
    address: spot.address,
    imageUrl: spot.imageUrl,
    latitude: spot.latitude,
    longitude: spot.longitude,
    active: spot.id === activeId,
  }));

  const moodCards = buildMoodCards(allSpots);

  const eventsMapCanvas = renderEventsMapCanvas({
    districtOptions: buildOptions(allSpots, 'district', filters.district),
    styleOptions: buildOptions(allSpots, 'style', filters.style),
    seasonOptions: buildOptions(allSpots, 'season', filters.season),
    sortOptions: [
      { value: 'popular', label: 'Сначала популярные', selected: filters.sort === 'popular' },
      { value: 'name', label: 'По названию А-Я', selected: filters.sort === 'name' },
    ],
    hasPins: pins.length > 0,
  });

  const eventsMapMoodSidebar = renderEventsMapMoodSidebar({
    heading: resolveMoodHeading(filters),
    cards: moodCards,
  });

  const html = renderTemplate('events-map-page', {
    user,
    headerSearch: { query: filters.query },
    eventsMapCanvas,
    eventsMapMoodSidebar,
  });

  return {
    html,
    mount(root) {
      const headerSearchForm = root.querySelector('[data-role="header-search-form"]');
      const detachCityPicker = attachHeaderCityPicker(root, { navigate, targetPath: ROUTE_PATH });
      const detachEventsMapCanvas = attachEventsMapCanvas(root, {
        pins,
        onFilterChange(name, value) {
          navigate(buildPagePath({
            [name as FilterSelectName]: value || null,
            active: null,
          }));
        },
        onPinPick(pinId) {
          navigate(`/events/${encodeURIComponent(pinId)}`);
        },
      });

      const navigateByHeaderQuery = (nextQuery: string) => {
        navigate(buildPagePath({ query: nextQuery || null }));
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
        detachHeaderSuggestions();
        detachEventsMapCanvas();

        if (headerSearchForm instanceof HTMLFormElement) {
          headerSearchForm.removeEventListener('submit', handleHeaderSearchSubmit);
        }
      };
    },
  };
}
