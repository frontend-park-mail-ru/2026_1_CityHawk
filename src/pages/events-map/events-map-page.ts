import './events-map-page.css';
import '../../modules/events-map/events-map-canvas.css';
import '../../modules/events-map/events-mood-sidebar.css';
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
import type { User } from '../../types/api.js';
import type { RouteContext, RouteView } from '../../types/router.js';

type SortValue = 'popular' | 'name';
type FilterSelectName = 'district' | 'style' | 'season' | 'sort';

interface PhotoSpot {
  id: string;
  title: string;
  imageUrl: string;
  district: string;
  districtLabel: string;
  style: string;
  styleLabel: string;
  season: string;
  seasonLabel: string;
  address: string;
  popularity: number;
  latitude: number;
  longitude: number;
}

interface FilterState {
  query: string;
  district: string;
  style: string;
  season: string;
  sort: SortValue;
  active: string;
}

interface MoodCard {
  title: string;
  imageUrl: string;
  href: string;
}

const ROUTE_PATH = '/events-map';

const SPOTS: PhotoSpot[] = [
  {
    id: 'patriarshie-prudy',
    title: 'Патриаршие пруды',
    imageUrl: '/public/static/img/photo.jpeg',
    district: 'cao',
    districtLabel: 'ЦАО',
    style: 'urban',
    styleLabel: 'Городской',
    season: 'summer',
    seasonLabel: 'Лето',
    address: 'Малая Бронная улица',
    popularity: 98,
    latitude: 55.76361,
    longitude: 37.595164,
  },
  {
    id: 'moscow-city',
    title: 'Москва-Сити',
    imageUrl: '/public/static/img/futurione.jpeg',
    district: 'cao',
    districtLabel: 'ЦАО',
    style: 'modern',
    styleLabel: 'Современный',
    season: 'all',
    seasonLabel: 'Круглый год',
    address: 'Пресненская набережная',
    popularity: 95,
    latitude: 55.749704,
    longitude: 37.537734,
  },
  {
    id: 'kolomenskoye',
    title: 'Коломенское',
    imageUrl: '/public/static/img/art.png',
    district: 'sao',
    districtLabel: 'ЮАО',
    style: 'nature',
    styleLabel: 'Природа',
    season: 'autumn',
    seasonLabel: 'Осень',
    address: 'Проспект Андропова, 39',
    popularity: 91,
    latitude: 55.667896,
    longitude: 37.668975,
  },
  {
    id: 'sokolniki-park',
    title: 'Парк Сокольники',
    imageUrl: '/public/static/img/concert.jpeg',
    district: 'eao',
    districtLabel: 'ВАО',
    style: 'nature',
    styleLabel: 'Природа',
    season: 'winter',
    seasonLabel: 'Зима',
    address: 'Сокольнический Вал, 1',
    popularity: 86,
    latitude: 55.793246,
    longitude: 37.679826,
  },
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

function matchesFilters(spot: PhotoSpot, filters: FilterState): boolean {
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

function sortSpots(items: PhotoSpot[], sort: SortValue): PhotoSpot[] {
  const normalized = [...items];

  if (sort === 'name') {
    return normalized.sort((a, b) => a.title.localeCompare(b.title, 'ru'));
  }

  return normalized.sort((a, b) => b.popularity - a.popularity);
}

function buildOptions(
  spots: PhotoSpot[],
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
  const byStyle: Record<string, string> = {
    urban: 'Городской вайб',
    modern: 'Футуризм',
    nature: 'Природа',
  };
  const bySeason: Record<string, string> = {
    summer: 'Летние кадры',
    winter: 'Зимняя атмосфера',
  };

  if (filters.style && byStyle[filters.style]) {
    return byStyle[filters.style];
  }

  if (filters.season && bySeason[filters.season]) {
    return bySeason[filters.season];
  }

  return 'Название подборки';
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

  const filtered = sortSpots(SPOTS.filter((spot) => matchesFilters(spot, filters)), filters.sort);
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

  const moodCards: MoodCard[] = [
    {
      title: 'Городской вайб',
      imageUrl: '/public/static/img/photo.jpeg',
      href: `${ROUTE_PATH}?style=urban`,
    },
    {
      title: 'Футуризм',
      imageUrl: '/public/static/img/futurione.jpeg',
      href: `${ROUTE_PATH}?style=modern`,
    },
    {
      title: 'Природа',
      imageUrl: '/public/static/img/art.png',
      href: `${ROUTE_PATH}?style=nature`,
    },
    {
      title: 'Летние кадры',
      imageUrl: '/public/static/img/concert.jpeg',
      href: `${ROUTE_PATH}?season=summer`,
    },
    {
      title: 'Зимняя атмосфера',
      imageUrl: '/public/static/img/navka.jpeg',
      href: `${ROUTE_PATH}?season=winter`,
    },
  ];

  const eventsMapCanvas = renderEventsMapCanvas({
    districtOptions: buildOptions(SPOTS, 'district', filters.district),
    styleOptions: buildOptions(SPOTS, 'style', filters.style),
    seasonOptions: buildOptions(SPOTS, 'season', filters.season),
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
