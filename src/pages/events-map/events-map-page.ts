import './events-map-page.css';
import '../../modules/events-map/events-map-canvas.css';
import '../../modules/events-map/events-mood-sidebar.css';
import {
  getMapCollectionSpots,
  getMapCollections,
} from '../../api/map.api.js';
import { getMeOrNull } from '../../api/profile.api.js';
import { attachHeaderCityPicker } from '../../components/header/header-city-picker.js';
import { attachHeaderSearchSuggestions } from '../../components/header/header-search-suggestions.js';
import { getHeaderUserDisplayName } from '../../components/header/header-user.js';
import { renderTemplate } from '../../app/templates/renderer.js';
import {
  attachEventsMapCanvas,
  renderEventsMapCanvas,
  type EventsMapPin,
} from '../../modules/events-map/events-map-canvas.js';
import { renderEventsMapMoodSidebar } from '../../modules/events-map/events-mood-sidebar.js';
import type {
  MapCollection,
  MapSpot,
  User,
} from '../../types/api.js';
import type { RouteContext, RouteView } from '../../types/router.js';

type SortValue = 'popular' | 'name' | 'dateAsc' | 'dateDesc';

type DatePreset = 'today' | 'weekend' | '';

interface FilterState {
  query: string;
  style: string;
  season: DatePreset;
  sort: SortValue;
  active: string;
  cityId: string;
  collectionId: string;
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
  const rawSeason = String(params.get('season') || '').trim();

  return {
    query: String(params.get('query') || '').trim(),
    style: String(params.get('style') || '').trim(),
    season: rawSeason === 'today' || rawSeason === 'weekend' ? rawSeason : '',
    sort: rawSort === 'name' || rawSort === 'dateAsc' || rawSort === 'dateDesc' ? rawSort : 'popular',
    active: String(params.get('active') || '').trim(),
    cityId: String(params.get('cityId') || '').trim(),
    collectionId: String(params.get('collectionId') || '').trim(),
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

function getDateRangeByPreset(preset: DatePreset): { dateFrom?: string; dateTo?: string } {
  if (!preset) {
    return {};
  }

  const now = new Date();
  if (preset === 'today') {
    const start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
    const end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
    return {
      dateFrom: start.toISOString().slice(0, 10),
      dateTo: end.toISOString().slice(0, 10),
    };
  }

  const day = now.getDay();
  const shiftToSaturday = day === 0 ? 6 : 6 - day;
  const saturday = new Date(now.getFullYear(), now.getMonth(), now.getDate() + shiftToSaturday);
  const sunday = new Date(now.getFullYear(), now.getMonth(), now.getDate() + shiftToSaturday + 1);

  return {
    dateFrom: saturday.toISOString().slice(0, 10),
    dateTo: sunday.toISOString().slice(0, 10),
  };
}

function toPins(spots: MapSpot[], active: string): EventsMapPin[] {
  return spots
    .map((spot) => {
      const place = spot.place || null;
      const latitude = Number(spot.latitude ?? place?.latitude);
      const longitude = Number(spot.longitude ?? place?.longitude);
      const id = String(spot.eventId || spot.id || '').trim();
      const placeAddress = [
        place?.name,
        place?.addressLine,
      ].filter(Boolean).join(', ');

      return {
        id,
        title: String(spot.title || '').trim() || 'Без названия',
        address: String(spot.address || '').trim() || placeAddress || 'Адрес не указан',
        imageUrl: String(spot.imageUrl || '').trim() || '/public/static/img/photo.jpeg',
        latitude,
        longitude,
        active: id === active,
      };
    })
    .filter((pin) => Boolean(pin.id) && Number.isFinite(pin.latitude) && Number.isFinite(pin.longitude));
}

function buildMoodCards(collections: MapCollection[]): MoodCard[] {
  return collections
    .slice(0, 5)
    .map((collection, index) => ({
      title: String(collection.title || '').trim() || 'Подборка',
      imageUrl: String(collection.imageUrl || '').trim() || FALLBACK_MOOD_IMAGES[index % FALLBACK_MOOD_IMAGES.length],
      href: buildPagePath({
        collectionId: collection.id,
        active: null,
      }),
    }));
}

function pickCollectionId(collections: MapCollection[], currentCollectionId: string): string {
  if (!collections.length) {
    return '';
  }

  if (!currentCollectionId) {
    return String(collections[0]?.id || '').trim();
  }

  return collections.some((item) => item.id === currentCollectionId) ? currentCollectionId : '';
}

async function loadMapData(filters: FilterState): Promise<{
  collections: MapCollection[];
  spots: MapSpot[];
}> {
  const collectionsResponse = await getMapCollections({
    cityId: filters.cityId || undefined,
    limit: 5,
  }).catch(() => ({ items: [] }));

  const collections = Array.isArray(collectionsResponse.items) ? collectionsResponse.items : [];
  const collectionId = pickCollectionId(collections, filters.collectionId);

  if (!collectionId) {
    return { collections, spots: [] };
  }

  const dateRange = getDateRangeByPreset(filters.season);
  const spotsResponse = await getMapCollectionSpots(collectionId, {
    cityId: filters.cityId || undefined,
    query: filters.query || undefined,
    tagId: filters.style || undefined,
    dateFrom: dateRange.dateFrom,
    dateTo: dateRange.dateTo,
    sort: filters.sort,
    limit: 200,
    offset: 0,
  }).catch(() => ({ items: [] }));

  return {
    collections,
    spots: Array.isArray(spotsResponse.items) ? spotsResponse.items : [],
  };
}

export async function eventsMapPage({ navigate }: RouteContext): Promise<RouteView> {
  const filters = getFilterStateFromLocation();
  const me = await getMeOrNull().catch(() => null);
  const user: (User & { displayName: string }) | null = me
    ? {
      ...me,
      displayName: getHeaderUserDisplayName(me),
    }
    : null;

  const { collections, spots } = await loadMapData(filters);
  const selectedCollectionId = pickCollectionId(collections, filters.collectionId);

  const activeId = spots.some((spot) => String(spot.eventId || spot.id || '').trim() === filters.active)
    ? filters.active
    : String(spots[0]?.eventId || spots[0]?.id || '').trim();

  const pins = toPins(spots, activeId);

  const eventsMapCanvas = renderEventsMapCanvas({
    hasPins: pins.length > 0,
  });

  const eventsMapMoodSidebar = renderEventsMapMoodSidebar({
    cards: buildMoodCards(collections),
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
        onPinPick(eventId) {
          navigate(`/events/${encodeURIComponent(eventId)}`);
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
