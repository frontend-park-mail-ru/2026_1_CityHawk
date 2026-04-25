import { getMeOrNull } from '../../api/profile.api.js';
import { getEvents } from '../../api/events.api.js';
import './profile.css';
import '../../modules/profile/profile-aside.css';
import '../../modules/profile/profile-overview.css';
import { attachHeaderCityPicker } from '../../components/header/header-city-picker.js';
import { attachHeaderSearchSuggestions } from '../../components/header/header-search-suggestions.js';
import { getHeaderUserDisplayName } from '../../components/header/header-user.js';
import { renderEventCard } from '../../components/event-card/event-card.js';
import { renderTemplate } from '../../app/templates/renderer.js';
import type { EventCard } from '../../types/api.js';
import type { RouteContext, RouteView } from '../../types/router.js';

function getUserInitials(name?: string): string {
  const parts = String(name || '')
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2);

  if (parts.length === 0) {
    return 'CH';
  }

  return parts.map((part) => part[0]?.toUpperCase() || '').join('');
}

function formatBirthday(value?: string): string {
  const raw = String(value || '').trim();

  if (!raw) {
    return 'Не указана';
  }

  const date = new Date(raw);
  if (Number.isNaN(date.getTime())) {
    return raw;
  }

  return new Intl.DateTimeFormat('ru-RU', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  }).format(date);
}

function formatEventDate(value?: string | null): string {
  if (!value) {
    return 'Дата уточняется';
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return String(value);
  }

  return new Intl.DateTimeFormat('ru-RU', {
    day: '2-digit',
    month: 'long',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

function mapEventToProfileCard(item: Partial<EventCard> = {}): string {
  const tags = Array.isArray(item.tags)
    ? item.tags.map((tag) => String(tag?.name || '').trim()).filter(Boolean).slice(0, 3)
    : [];
  const placeText = [
    String(item.nextSession?.place?.name || '').trim(),
    String(item.nextSession?.place?.addressLine || '').trim(),
  ].filter(Boolean).join(', ') || 'Место уточняется';

  return renderEventCard({
    id: item.id || '',
    imageUrl: item.coverImageUrl || '/public/static/img/concert.jpeg',
    title: item.title || 'Без названия',
    textLines: [formatEventDate(item.nextSession?.startAt), placeText],
    tags,
    cardClass: 'profile-overview__event-card',
  });
}

function getFallbackEvents(): EventCard[] {
  return [
    {
      id: '',
      title: 'Futurione',
      coverImageUrl: '/public/static/img/futurione.jpeg',
      tags: [{ id: '1', name: 'Digital', slug: 'digital' }],
      nextSession: {
        startAt: '2026-05-06T18:00:00Z',
        place: { name: 'ВДНХ', addressLine: 'Москва' },
      },
    },
    {
      id: '',
      title: 'Женский стендап',
      coverImageUrl: '/public/static/img/standup.png',
      tags: [{ id: '2', name: 'Comedy', slug: 'comedy' }],
      nextSession: {
        startAt: '2026-05-07T19:00:00Z',
        place: { name: 'Live Арена', addressLine: 'Москва' },
      },
    },
    {
      id: '',
      title: 'Ледовое шоу',
      coverImageUrl: '/public/static/img/navka.jpeg',
      tags: [{ id: '3', name: 'Show', slug: 'show' }],
      nextSession: {
        startAt: '2026-05-11T17:30:00Z',
        place: { name: 'Навка Арена', addressLine: 'Москва' },
      },
    },
    {
      id: '',
      title: 'Балет',
      coverImageUrl: '/public/static/img/balet.jpg',
      tags: [{ id: '4', name: 'Театр', slug: 'theatre' }],
      nextSession: {
        startAt: '2026-05-18T16:00:00Z',
        place: { name: 'Большой театр', addressLine: 'Театральная площадь, 1' },
      },
    },
  ];
}

export async function profilePage({ navigate }: RouteContext): Promise<RouteView> {
  const me = await getMeOrNull().catch(() => null);
  const displayName = getHeaderUserDisplayName(me) || 'Пользователь';
  const fallbackEvents = getFallbackEvents();

  const [myEventsResult, favoriteEventsResult] = await Promise.allSettled([
    me?.id
      ? getEvents({ authorId: String(me.id), limit: 4, offset: 0 })
      : Promise.resolve({ items: fallbackEvents }),
    getEvents({ limit: 4, offset: 4 }),
  ]);

  const myEvents = myEventsResult.status === 'fulfilled' && Array.isArray(myEventsResult.value?.items)
    ? myEventsResult.value.items
    : fallbackEvents;
  const favoriteEvents = favoriteEventsResult.status === 'fulfilled'
    && Array.isArray(favoriteEventsResult.value?.items)
    ? favoriteEventsResult.value.items
    : fallbackEvents;

  const user = {
    displayName,
    name: displayName,
    firstName: me?.username || 'Не указано',
    lastName: me?.userSurname || '',
    email: me?.email || 'Не указан',
    birthdateLabel: formatBirthday(me?.birthday || ''),
    cityName: me?.city?.name || 'Не указан',
    initials: getUserInitials(displayName),
    avatarUrl: me?.avatarUrl || '',
    bio: 'Люблю открывать новые места в городе, ходить на события и сохранять лучшие маршруты.',
    tags: ['Городские маршруты', 'События', 'Фотолокации'],
  };

  const html = renderTemplate('profile', {
    user,
    headerSearch: { query: '' },
    myEventCards: myEvents.slice(0, 4).map(mapEventToProfileCard),
    favoriteEventCards: favoriteEvents.slice(0, 4).map(mapEventToProfileCard),
    stats: {
      myEvents: myEvents.length,
      favorites: favoriteEvents.length,
    },
    isProfilePage: true,
    isSettingsPage: false,
    enableAvatarUpload: false,
  });

  return {
    html,
    mount(root) {
      const editButton = root.querySelector('[data-role="profile-edit-button"]');
      const headerSearchForm = root.querySelector('[data-role="header-search-form"]');
      const detachCityPicker = attachHeaderCityPicker(root, { navigate, targetPath: '/events' });

      const handleEditClick = (): void => {
        navigate('/profile/settings');
      };

      const navigateByHeaderQuery = (nextQuery: string): void => {
        const params = new URLSearchParams();
        if (nextQuery.trim()) {
          params.set('query', nextQuery.trim());
        }
        const suffix = params.toString() ? `?${params.toString()}` : '';
        navigate(`/events${suffix}`);
      };

      const handleHeaderSearchSubmit = (event: SubmitEvent): void => {
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

      if (editButton instanceof HTMLButtonElement) {
        editButton.addEventListener('click', handleEditClick);
      }

      return () => {
        detachCityPicker();
        detachHeaderSuggestions();

        if (headerSearchForm instanceof HTMLFormElement) {
          headerSearchForm.removeEventListener('submit', handleHeaderSearchSubmit);
        }

        if (editButton instanceof HTMLButtonElement) {
          editButton.removeEventListener('click', handleEditClick);
        }
      };
    },
  };
}
