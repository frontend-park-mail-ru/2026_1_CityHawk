import './event-page.css';
import { getEventById, getEvents } from '../../api/events.api.js';
import { createEventInvitations, searchEventInvitees } from '../../api/invitations.api.js';
import { getMeOrNull } from '../../api/profile.api.js';
import '../../modules/events/details/event-hero.css';
import '../../modules/events/details/event-description.css';
import '../../modules/events/details/event-gallery.css';
import '../../modules/events/details/event-location.css';
import '../../modules/events/details/event-recommendations.css';
import { getHeaderUserDisplayName } from '../../components/header/header-user.js';
import { attachHeaderSearchSuggestions } from '../../components/header/header-search-suggestions.js';
import { attachHeaderCityPicker } from '../../components/header/header-city-picker.js';
import { renderTemplate } from '../../app/templates/renderer.js';
import { showToast } from '../../app/ui/toast.js';
import { attachEventDescription, renderEventDescription } from '../../modules/events/details/event-description.js';
import { attachEventGallery, renderEventGallery } from '../../modules/events/details/event-gallery.js';
import { attachEventHeroFavorite, renderEventHero } from '../../modules/events/details/event-hero.js';
import { attachEventLocation, renderEventLocation } from '../../modules/events/details/event-location.js';
import { localizeCategoryName } from '../../modules/events/common/category-localization.js';
import { formatEventDateOrPeriod } from '../../modules/events/common/event-date-label.js';
import { renderEventRecommendations } from '../../modules/events/details/event-recommendations.js';
import type {
  EventCard,
  EventDetails,
  EventImage,
  EventSession,
  EventInvitee,
  Place,
  User,
} from '../../types/api.js';
import type { RouteContext, RouteView } from '../../types/router.js';

interface GalleryImageViewModel {
  imageUrl: string;
  alt: string;
}

interface EventPageViewModel {
  id: string;
  category: string;
  title: string;
  dateText: string;
  placeText: string;
  posterUrl: string;
  leadText: string;
  paragraphs: string[];
  locationParagraphs: string[];
  galleryImages: GalleryImageViewModel[];
  mapImageUrl: string;
  mapAlt: string;
  mapLatitude?: number;
  mapLongitude?: number;
  mapTitle: string;
}

interface EventShareViewModel {
  title: string;
  text: string;
  dateText: string;
  placeText: string;
  posterUrl: string;
  url: string;
}

interface EventInviteUserViewModel {
  id: string;
  displayName: string;
  cityText: string;
  avatarUrl: string;
  initials: string;
  invitationStatus?: EventInvitee['invitationStatus'];
}

interface RecommendationViewModel {
  id: string;
  imageUrl: string;
  title: string;
  description: string;
  tags: string[];
  isFavorite: boolean;
}

function getFollowUserDisplayName(user: Partial<FollowUser> = {}): string {
  const email = String(user.email || '').trim();

  return String(user.username || '').trim()
    || email
    || 'Пользователь';
}

function getInitials(name: string): string {
  const parts = String(name || '')
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  return parts
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || '')
    .join('')
    || 'CH';
}

function mapFollowUserToInviteViewModel(user: Partial<EventInvitee> = {}): EventInviteUserViewModel {
  const displayName = getFollowUserDisplayName(user);

  return {
    id: String(user.id || '').trim(),
    displayName,
    cityText: user.city?.name || 'Город не указан',
    avatarUrl: String(user.avatarUrl || '').trim(),
    initials: getInitials(displayName),
    invitationStatus: user.invitationStatus,
  };
}

interface LoosePlace extends Partial<Omit<Place, 'city'>> {
  city?: Partial<NonNullable<Place['city']>> | null;
  description?: string;
}

type EventDetailsLike = Omit<Partial<EventDetails>, 'images' | 'sessions'> & {
  dateText?: string;
  city?: Partial<NonNullable<Place['city']>> | null;
  category?: {
    name?: string;
  };
  place?: LoosePlace | null;
  images?: Array<Partial<EventImage> & { url?: string; alt?: string }>;
  sessions?: Array<Partial<Omit<EventSession, 'place'>> & { place?: LoosePlace | null }>;
};

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

function formatEventPeriod(startAt?: string | null, endAt?: string | null): string | null {
  if (!startAt || !endAt) {
    return null;
  }

  const start = new Date(startAt);
  const end = new Date(endAt);

  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    return null;
  }

  const sameYear = start.getFullYear() === end.getFullYear();
  const sameMonth = sameYear && start.getMonth() === end.getMonth();
  const sameDay = sameMonth && start.getDate() === end.getDate();

  if (sameDay) {
    return null;
  }

  const monthGenitive = [
    'января',
    'февраля',
    'марта',
    'апреля',
    'мая',
    'июня',
    'июля',
    'августа',
    'сентября',
    'октября',
    'ноября',
    'декабря',
  ];
  const shortFormatter = new Intl.DateTimeFormat('ru-RU', { day: 'numeric', month: 'long' });

  if (sameMonth) {
    return `${start.getDate()}-${end.getDate()} ${monthGenitive[start.getMonth()]}`;
  }

  const startLabel = shortFormatter.format(start);
  const endLabel = shortFormatter.format(end);
  return `${startLabel} - ${endLabel}`;
}

function mapEventImagesToGalleryViewModel(rawEvent: EventDetailsLike): GalleryImageViewModel[] {
  const images = Array.isArray(rawEvent.images) ? rawEvent.images : [];
  const title = rawEvent.title || 'Мероприятие';

  if (images.length > 0) {
    return images.slice(0, 4).map((item, index) => ({
      imageUrl: item.imageUrl || item.url || '',
      alt: item.alt || `${title} - кадр ${index + 1}`,
    }));
  }

  return [
    { imageUrl: '/public/static/img/futurione.jpeg', alt: `${title} - постер` },
    { imageUrl: '/public/static/img/photo.jpeg', alt: `${title} - атмосфера` },
    { imageUrl: '/public/static/img/art.png', alt: `${title} - детали` },
    { imageUrl: '/public/static/img/concert.jpeg', alt: `${title} - площадка` },
  ];
}

function toFiniteCoordinate(value: unknown): number | undefined {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function getPlaceCoordinates(place?: LoosePlace | null): { latitude?: number; longitude?: number } {
  return {
    latitude: toFiniteCoordinate(place?.latitude),
    longitude: toFiniteCoordinate(place?.longitude),
  };
}

function resolveEventMapCoordinates(rawEvent: EventDetailsLike): { latitude?: number; longitude?: number } {
  const sessions = Array.isArray(rawEvent.sessions) ? rawEvent.sessions : [];
  const firstSessionPlace = sessions[0]?.place as LoosePlace | null | undefined;
  const nextSessionPlace = (rawEvent as unknown as { nextSession?: { place?: LoosePlace | null } })
    .nextSession?.place;

  const fromFirstSession = getPlaceCoordinates(firstSessionPlace);
  if (fromFirstSession.latitude !== undefined && fromFirstSession.longitude !== undefined) {
    return fromFirstSession;
  }

  const fromNextSession = getPlaceCoordinates(nextSessionPlace);
  if (fromNextSession.latitude !== undefined && fromNextSession.longitude !== undefined) {
    return fromNextSession;
  }

  const fromEventPlace = getPlaceCoordinates(rawEvent.place);
  if (fromEventPlace.latitude !== undefined && fromEventPlace.longitude !== undefined) {
    return fromEventPlace;
  }

  for (const session of sessions) {
    const sessionPlace = session?.place as LoosePlace | null | undefined;
    const { latitude, longitude } = getPlaceCoordinates(sessionPlace);
    if (latitude !== undefined && longitude !== undefined) {
      return { latitude, longitude };
    }
  }

  return {};
}

function mapEventDetailsToPageViewModel(rawEvent: EventDetailsLike = {}): EventPageViewModel {
  const firstSession = Array.isArray(rawEvent.sessions) ? rawEvent.sessions[0] : null;
  const nextSessionPlace = (rawEvent as unknown as { nextSession?: { place?: LoosePlace | null } })
    .nextSession?.place;
  const place: LoosePlace | null = firstSession?.place || nextSessionPlace || rawEvent.place || null;
  const mapCoordinates = resolveEventMapCoordinates(rawEvent);
  const title = rawEvent.title || 'Futurione';
  const description = rawEvent.fullDescription || '';
  const rawParagraphs = description
    .split(/\n+/)
    .map((part) => part.trim())
    .filter(Boolean);
  const paragraphs = rawParagraphs.length <= 1 && rawParagraphs[0] && rawParagraphs[0].length > 320
    ? rawParagraphs[0]
      .split(/(?<=[.!?])\s+/)
      .map((part) => part.trim())
      .filter(Boolean)
    : rawParagraphs;

  const safeParagraphs = paragraphs.length > 0
    ? paragraphs
    : [
      'Погрузитесь в атмосферу события, где музыка, пространство и настроение собираются в один цельный опыт.',
      'Мы сохранили модульную структуру страницы, чтобы позже сюда безболезненно подключить реальные данные с backend.',
      'Каркас уже готов для полноценной деталки мероприятия с галереей, локацией и рекомендациями.',
    ];

  const locationParts = [
    place?.addressLine,
    firstSession?.placeName || place?.name || rawEvent.placeName,
    place?.city?.name || rawEvent.city?.name,
  ].filter(Boolean);
  const categories = Array.isArray(rawEvent.categories) ? rawEvent.categories : [];
  const legacyCategoryName = rawEvent.category?.name || '';
  const category = categories[0]
    ? localizeCategoryName(categories[0])
    : localizeCategoryName({ name: legacyCategoryName }) || 'Мероприятие';
  const galleryImages = mapEventImagesToGalleryViewModel(rawEvent);

  return {
    id: String(rawEvent.id || ''),
    category,
    title,
    dateText: formatEventPeriod(firstSession?.startAt, firstSession?.endAt)
      || formatEventDate(firstSession?.startAt || rawEvent.dateText),
    placeText: locationParts.join(', '),
    posterUrl: rawEvent.coverImageUrl || galleryImages[0]?.imageUrl || '',
    leadText: rawEvent.shortDescription || 'Актуальная информация о событии, времени и формате посещения.',
    paragraphs: safeParagraphs,
    locationParagraphs: [
      locationParts.join(', ') || 'Адрес будет добавлен позже.',
    ],
    galleryImages,
    mapImageUrl: '/public/static/img/map.jpeg',
    mapAlt: `Карта для ${title}`,
    mapLatitude: mapCoordinates.latitude,
    mapLongitude: mapCoordinates.longitude,
    mapTitle: firstSession?.placeName || place?.name || rawEvent.placeName || title,
  };
}

function getFallbackEvent(eventId: string): EventDetailsLike {
  return {
    id: eventId,
    title: 'Futurione',
    shortDescription: 'Фиджитал-пространство, где искусство и цифровые технологии создают новый зрительский опыт.',
    fullDescription: [
      'Погрузитесь в уникальное цифровое арт-пространство Futurione - место, где искусство переплетается с технологиями будущего, а каждый шаг дарит новые яркие впечатления.',
      'Каждый зал Futurione - это отдельная вселенная: от футуристичных тоннелей и световых коридоров до погружения в живые цифровые леса и абстрактные пространства.',
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
          latitude: 55.829754,
          longitude: 37.633088,
          city: {
            name: 'Москва',
          },
          description: 'Ориентир - колесо обозрения "Солнце Москвы". Вход в пространство расположен у основания комплекса.',
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

function mapEventToRecommendationViewModel(item: Partial<EventCard> = {}): RecommendationViewModel {
  const placeParts = [
    item.nextSession?.placeName || item.nextSession?.place?.name,
    item.nextSession?.place?.addressLine,
  ].filter(Boolean);
  const fallbackPlaceParts = [
    item.placeName || item.place?.name,
    item.place?.addressLine,
  ].filter(Boolean);
  const dateText = formatEventDateOrPeriod(item);
  const placeText = placeParts.join(', ') || fallbackPlaceParts.join(', ');
  const tags = Array.isArray(item.tags)
    ? item.tags.map((tag) => tag?.name || '').filter(Boolean)
    : [];

  return {
    id: item.id || '',
    imageUrl: item.coverImageUrl || '/public/static/img/concert.jpeg',
    title: item.title || 'Мероприятие',
    description: [dateText, placeText].filter(Boolean).join(' · ') || 'Подробности скоро появятся',
    tags,
    isFavorite: Boolean(item.isFavorite),
  };
}

function mapRecommendationsToViewModel(
  response: { items?: EventCard[] } | null,
  currentEventId: string,
): RecommendationViewModel[] {
  const items = Array.isArray(response?.items) ? response.items : [];

  const normalized = items
    .filter((item) => String(item.id || '') !== String(currentEventId))
    .slice(0, 4)
    .map(mapEventToRecommendationViewModel);

  if (normalized.length > 0) {
    return normalized;
  }

  return [
    {
      id: '',
      imageUrl: '/public/static/img/standup.png',
      title: 'Женский стендап',
      description: '27 марта · Live Арена, Москва',
      tags: ['Comedy'],
      isFavorite: false,
    },
    {
      id: '',
      imageUrl: '/public/static/img/navka.jpeg',
      title: 'Ледовое шоу Татьяны Навки',
      description: '10 февраля · Навка Арена, Москва',
      tags: ['Show', 'Ice'],
      isFavorite: false,
    },
    {
      id: '',
      imageUrl: '/public/static/img/balet.jpg',
      title: 'Балет Щелкунчик',
      description: '14 марта · Большой театр, Москва',
      tags: ['Ballet'],
      isFavorite: false,
    },
    {
      id: '',
      imageUrl: '/public/static/img/concert.jpeg',
      title: 'Вечерний концерт',
      description: 'Суббота · Центр города',
      tags: ['Music'],
      isFavorite: false,
    },
  ];
}

async function copyTextToClipboard(text: string): Promise<void> {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text);
    return;
  }

  const textarea = document.createElement('textarea');
  textarea.value = text;
  textarea.setAttribute('readonly', 'true');
  textarea.style.position = 'fixed';
  textarea.style.left = '-9999px';
  textarea.style.top = '0';
  document.body.append(textarea);
  textarea.select();

  const copied = document.execCommand('copy');
  textarea.remove();

  if (!copied) {
    throw new Error('Copy command failed');
  }
}

function attachEventShareModal(root: ParentNode): () => void {
  const modal = root.querySelector<HTMLElement>('[data-role="event-share-modal"]');
  const openButtons = Array.from(root.querySelectorAll<HTMLButtonElement>('[data-action="event-share-open"]'));
  const closeButtons = Array.from(root.querySelectorAll<HTMLButtonElement>('[data-role="event-share-close"]'));
  const copyButton = root.querySelector<HTMLButtonElement>('[data-action="event-share-copy"]');
  const nativeShareButton = root.querySelector<HTMLButtonElement>('[data-action="event-share-native"]');
  const chatButton = root.querySelector<HTMLButtonElement>('[data-action="event-share-chat"]');

  if (!(modal instanceof HTMLElement) || openButtons.length === 0) {
    return () => {};
  }

  const closeModal = () => {
    modal.hidden = true;
    document.body.style.overflow = '';
  };

  const onHeroShareClick = async (event: Event) => {
    const button = event.currentTarget;
    const shareUrl = button instanceof HTMLButtonElement
      ? String(button.dataset.shareUrl || copyButton?.dataset.shareUrl || window.location.href)
      : String(copyButton?.dataset.shareUrl || window.location.href);

    try {
      await copyTextToClipboard(shareUrl);
      showToast('Ссылка на событие скопирована', { type: 'success' });
    } catch {
      showToast('Не удалось скопировать ссылку');
    }
  };

  const onKeyDown = (event: KeyboardEvent) => {
    if (event.key === 'Escape' && !modal.hidden) {
      closeModal();
    }
  };

  const onCopyClick = async () => {
    const shareUrl = String(copyButton?.dataset.shareUrl || window.location.href);

    try {
      await copyTextToClipboard(shareUrl);
      showToast('Ссылка на событие скопирована', { type: 'success' });
    } catch {
      showToast('Не удалось скопировать ссылку');
    }
  };

  const onNativeShareClick = async () => {
    const shareTitle = String(nativeShareButton?.dataset.shareTitle || document.title);
    const shareText = String(nativeShareButton?.dataset.shareText || '');
    const shareUrl = String(nativeShareButton?.dataset.shareUrl || window.location.href);

    if (navigator.share) {
      try {
        await navigator.share({
          title: shareTitle,
          text: shareText,
          url: shareUrl,
        });
        return;
      } catch (error) {
        if (error instanceof DOMException && error.name === 'AbortError') {
          return;
        }
      }
    }

    try {
      await copyTextToClipboard(shareUrl);
      showToast('Ссылка скопирована для отправки', { type: 'success' });
    } catch {
      showToast('Не удалось подготовить ссылку');
    }
  };

  const onChatClick = async () => {
    const shareUrl = String(chatButton?.dataset.shareUrl || window.location.href);

    try {
      await copyTextToClipboard(shareUrl);
      showToast('Ссылка скопирована для чата', { type: 'success' });
    } catch {
      showToast('Чат пока не подключен, ссылку скопировать не удалось');
    }
  };

  openButtons.forEach((button) => button.addEventListener('click', onHeroShareClick));
  closeButtons.forEach((button) => button.addEventListener('click', closeModal));
  copyButton?.addEventListener('click', onCopyClick);
  nativeShareButton?.addEventListener('click', onNativeShareClick);
  chatButton?.addEventListener('click', onChatClick);
  document.addEventListener('keydown', onKeyDown);

  return () => {
    document.body.style.overflow = '';
    openButtons.forEach((button) => button.removeEventListener('click', onHeroShareClick));
    closeButtons.forEach((button) => button.removeEventListener('click', closeModal));
    copyButton?.removeEventListener('click', onCopyClick);
    nativeShareButton?.removeEventListener('click', onNativeShareClick);
    chatButton?.removeEventListener('click', onChatClick);
    document.removeEventListener('keydown', onKeyDown);
  };
}

function attachEventInviteModal(root: ParentNode, eventId: string): () => void {
  const modal = root.querySelector<HTMLElement>('[data-role="event-invite-modal"]');
  const openButtons = Array.from(root.querySelectorAll<HTMLButtonElement>('[data-action="event-invite-open"]'));
  const closeButtons = Array.from(root.querySelectorAll<HTMLButtonElement>('[data-role="event-invite-close"]'));
  const searchInput = root.querySelector<HTMLInputElement>('[data-role="event-invite-search"]');
  const list = root.querySelector<HTMLElement>('[data-role="event-invite-list"]');
  const selectedCount = root.querySelector<HTMLElement>('[data-role="event-invite-selected-count"]');
  const sendButton = root.querySelector<HTMLButtonElement>('[data-action="event-invite-send"]');

  if (!(modal instanceof HTMLElement) || openButtons.length === 0) {
    return () => {};
  }

  const selectedIds = new Set<string>();
  const invitedUserIds = new Set<string>();
  let previousActiveElement: Element | null = null;
  let searchTimerId: number | null = null;

  const getRows = () => Array.from(modal.querySelectorAll<HTMLElement>('[data-role="event-invite-user"]'));

  const resetSelection = () => {
    selectedIds.clear();
    getRows().forEach((row) => {
      const checkbox = row.querySelector<HTMLInputElement>('[data-role="event-invite-checkbox"]');
      if (checkbox instanceof HTMLInputElement) {
        checkbox.checked = false;
      }
    });
    updateSelectedCount();
  };

  const syncInvitedUserIds = () => {
    invitedUserIds.clear();
    getRows().forEach((row) => {
      const userId = String(row.dataset.userId || '').trim();
      const invitationStatus = String(row.dataset.invitationStatus || '').trim();
      if (userId && invitationStatus) {
        invitedUserIds.add(userId);
      }
    });
  };

  const updateSelectedCount = () => {
    if (selectedCount instanceof HTMLElement) {
      selectedCount.textContent = String(selectedIds.size);
    }

    if (sendButton instanceof HTMLButtonElement) {
      sendButton.disabled = selectedIds.size === 0;
    }
  };

  const createInvitedStatus = (): HTMLSpanElement => {
    const status = document.createElement('span');
    status.className = 'event-invite-modal__status';
    status.textContent = 'Приглашён(а)';
    return status;
  };

  const openModal = () => {
    syncInvitedUserIds();
    resetSelection();
    if (searchInput instanceof HTMLInputElement) {
      searchInput.value = '';
    }
    getRows().forEach((row) => {
      row.hidden = false;
    });
    previousActiveElement = document.activeElement;
    modal.hidden = false;
    document.body.style.overflow = 'hidden';
    window.setTimeout(() => {
      searchInput?.focus();
    }, 0);
  };

  const closeModal = () => {
    resetSelection();
    modal.hidden = true;
    document.body.style.overflow = '';

    if (previousActiveElement instanceof HTMLElement) {
      previousActiveElement.focus();
    }
  };

  const filterRows = () => {
    const query = String(searchInput?.value || '').trim().toLowerCase();
    getRows().forEach((row) => {
      const haystack = `${row.dataset.userName || ''} ${row.dataset.userCity || ''}`.toLowerCase();
      row.hidden = Boolean(query) && !haystack.includes(query);
    });
  };

  const renderSearchResults = (users: EventInvitee[]) => {
    if (!(list instanceof HTMLElement)) {
      return;
    }

    list.querySelector('.event-invite-modal__empty')?.remove();

    const existingIds = new Set(getRows().map((row) => String(row.dataset.userId || '')));
    users
      .map(mapFollowUserToInviteViewModel)
      .filter((user) => user.id && !existingIds.has(user.id) && !user.invitationStatus && !invitedUserIds.has(user.id))
      .forEach((user) => {
        const label = document.createElement('label');
        label.className = 'event-invite-modal__person';
        label.dataset.role = 'event-invite-user';
        label.dataset.userId = user.id;
        label.dataset.userName = user.displayName;
        label.dataset.userCity = user.cityText;

        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.className = 'event-invite-modal__checkbox';
        checkbox.dataset.role = 'event-invite-checkbox';
        checkbox.value = user.id;

        const avatar = document.createElement('span');
        avatar.className = 'event-invite-modal__avatar';
        if (user.avatarUrl) {
          const image = document.createElement('img');
          image.src = user.avatarUrl;
          image.alt = '';
          avatar.append(image);
        } else {
          avatar.textContent = user.initials;
        }

        const info = document.createElement('span');
        info.className = 'event-invite-modal__person-info';

        const name = document.createElement('span');
        name.className = 'event-invite-modal__person-name';
        name.textContent = user.displayName;

        const city = document.createElement('span');
        city.className = 'event-invite-modal__person-city';
        city.textContent = user.cityText;

        info.append(name, city);

        const mark = document.createElement('span');
        mark.className = 'event-invite-modal__checkmark';
        mark.setAttribute('aria-hidden', 'true');
        mark.textContent = '✓';
        label.append(checkbox, avatar, info, mark);
        list.append(label);
      });

    filterRows();
  };

  const handleSearchInput = () => {
    filterRows();

    if (searchTimerId) {
      window.clearTimeout(searchTimerId);
    }

    const query = String(searchInput?.value || '').trim();
    if (query.length < 2) {
      return;
    }

    searchTimerId = window.setTimeout(async () => {
      try {
        const response = await searchEventInvitees(eventId, query, 10);
        renderSearchResults(Array.isArray(response?.items) ? response.items : []);
      } catch {
        showToast('Не удалось найти пользователей');
      }
    }, 280);
  };

  const handleListChange = (event: Event) => {
    const target = event.target;
    if (!(target instanceof HTMLInputElement) || target.dataset.role !== 'event-invite-checkbox') {
      return;
    }

    const userId = String(target.value || '').trim();
    if (!userId) {
      return;
    }

    if (target.checked) {
      selectedIds.add(userId);
    } else {
      selectedIds.delete(userId);
    }

    updateSelectedCount();
  };

  const handleSendInvite = async () => {
    if (selectedIds.size === 0) {
      showToast('Выберите хотя бы одного получателя');
      return;
    }

    const recipientIds = Array.from(selectedIds);

    if (sendButton instanceof HTMLButtonElement) {
      sendButton.disabled = true;
    }

    try {
      await createEventInvitations(eventId, {
        recipientIds,
      });

      recipientIds.forEach((recipientId) => {
        invitedUserIds.add(recipientId);
        const row = getRows().find((item) => String(item.dataset.userId || '').trim() === recipientId);
        if (!(row instanceof HTMLElement)) {
          return;
        }

        row.dataset.invitationStatus = 'pending';
        const checkbox = row.querySelector<HTMLInputElement>('[data-role="event-invite-checkbox"]');
        if (checkbox instanceof HTMLInputElement) {
          checkbox.checked = false;
          checkbox.remove();
        }

        if (!row.querySelector('.event-invite-modal__status')) {
          row.querySelector('.event-invite-modal__checkmark')?.replaceWith(createInvitedStatus());
        }
      });

      resetSelection();
      showToast(`Приглашение отправлено: ${recipientIds.length}`, { type: 'success' });
      closeModal();
    } catch {
      showToast('Не удалось отправить приглашение');
    } finally {
      updateSelectedCount();
    }
  };

  const onKeyDown = (event: KeyboardEvent) => {
    if (event.key === 'Escape' && !modal.hidden) {
      closeModal();
    }
  };

  openButtons.forEach((button) => button.addEventListener('click', openModal));
  closeButtons.forEach((button) => button.addEventListener('click', closeModal));
  searchInput?.addEventListener('input', handleSearchInput);
  list?.addEventListener('change', handleListChange);
  sendButton?.addEventListener('click', handleSendInvite);
  document.addEventListener('keydown', onKeyDown);
  syncInvitedUserIds();
  updateSelectedCount();

  return () => {
    document.body.style.overflow = '';

    if (searchTimerId) {
      window.clearTimeout(searchTimerId);
    }

    openButtons.forEach((button) => button.removeEventListener('click', openModal));
    closeButtons.forEach((button) => button.removeEventListener('click', closeModal));
    searchInput?.removeEventListener('input', handleSearchInput);
    list?.removeEventListener('change', handleListChange);
    sendButton?.removeEventListener('click', handleSendInvite);
    document.removeEventListener('keydown', onKeyDown);
  };
}

export async function eventPage({ navigate, params = {} }: RouteContext): Promise<RouteView> {
  const eventId = params.eventId || 'demo-event';
  const headerQuery = new URLSearchParams(window.location.search).get('query') || '';
  const me = await getMeOrNull();
  const user: (User & { displayName: string }) | null = me
    ? {
      ...me,
      displayName: getHeaderUserDisplayName(me),
    }
    : null;

  let rawEvent: EventDetailsLike = getFallbackEvent(eventId);

  try {
    rawEvent = await getEventById(eventId);
  } catch {
    rawEvent = getFallbackEvent(eventId);
  }

  let recommendations: RecommendationViewModel[] = [];
  let inviteUsers: EventInviteUserViewModel[] = [];

  try {
    const response = await getEvents({ limit: 4 });
    recommendations = mapRecommendationsToViewModel(response, eventId);
  } catch {
    recommendations = mapRecommendationsToViewModel(null, eventId);
  }

  const event = mapEventDetailsToPageViewModel(rawEvent);
  const shareUrl = new URL(`/events/${encodeURIComponent(eventId)}`, window.location.origin).toString();
  const eventShare: EventShareViewModel = {
    title: event.title,
    text: `${event.title} - ${event.dateText}`,
    dateText: event.dateText,
    placeText: event.placeText,
    posterUrl: event.posterUrl,
    url: shareUrl,
  };
  const html = renderTemplate('event', {
    headerSearch: { query: headerQuery },
    eventHero: renderEventHero({
      eventId,
      category: event.category,
      title: event.title,
      dateText: event.dateText,
      placeText: event.placeText,
      posterUrl: event.posterUrl,
      shareUrl: eventShare.url,
      isFavorite: Boolean(rawEvent.isFavorite),
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
      mapLatitude: event.mapLatitude,
      mapLongitude: event.mapLongitude,
      mapTitle: event.mapTitle,
    }),
    eventRecommendations: renderEventRecommendations({
      items: recommendations,
    }),
    ownerActions: rawEvent.isOwner
      ? {
        editHref: `/events/${encodeURIComponent(String(eventId))}/edit`,
        deleteHref: `/events/${encodeURIComponent(String(eventId))}/delete`,
      }
      : null,
    eventShare,
    inviteUsers,
    hasInviteUsers: inviteUsers.length > 0,
    user,
  });

  return {
    html,
    mount(root) {
      const headerSearchForm = root.querySelector('[data-role="header-search-form"]');
      const detachCityPicker = attachHeaderCityPicker(root, {
        navigate,
        targetPath: '/events',
      });

      attachEventDescription(root);
      const detachEventGallery = attachEventGallery(root);
      const detachEventHeroFavorite = attachEventHeroFavorite(root);
      const detachEventLocation = attachEventLocation(root);
      const detachEventShareModal = attachEventShareModal(root);
      const detachEventInviteModal = attachEventInviteModal(root, eventId);

      const navigateByHeaderQuery = (nextQuery: string) => {
        const nextParams = new URLSearchParams();

        if (nextQuery) {
          nextParams.set('query', nextQuery);
        }

        const suffix = nextParams.toString() ? '?' + nextParams.toString() : '';
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
        detachEventGallery();
        detachEventHeroFavorite();
        detachEventLocation();
        detachEventShareModal();
        detachEventInviteModal();
        detachHeaderSuggestions();

        if (headerSearchForm instanceof HTMLFormElement) {
          headerSearchForm.removeEventListener('submit', handleHeaderSearchSubmit);
        }
      };
    },
  };
}
