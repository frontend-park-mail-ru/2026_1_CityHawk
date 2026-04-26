import { getMeOrNull } from '../../api/profile.api.js';
import { getEvents } from '../../api/events.api.js';
import {
  followUser,
  getMyFollowers,
  getMyFollowing,
  unfollowUser,
} from '../../api/follows.api.js';
import './profile.css';
import '../../modules/profile/profile-aside.css';
import '../../modules/profile/profile-overview.css';
import { attachHeaderCityPicker } from '../../components/header/header-city-picker.js';
import { attachHeaderSearchSuggestions } from '../../components/header/header-search-suggestions.js';
import { getHeaderUserDisplayName } from '../../components/header/header-user.js';
import { renderEventCard } from '../../components/event-card/event-card.js';
import { showToast } from '../../app/ui/toast.js';
import { renderTemplate } from '../../app/templates/renderer.js';
import type { EventCard, FollowUser } from '../../types/api.js';
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
    isFavorite: Boolean(item.isFavorite),
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

function getFollowDisplayName(user: Partial<FollowUser>): string {
  const first = String(user.username || '').trim();
  const last = String(user.userSurname || '').trim();
  return [first, last].filter(Boolean).join(' ') || 'Пользователь';
}

function getFallbackFollowers(): FollowUser[] {
  return [
    {
      id: 'a0a00000-0000-4000-8000-000000000001',
      username: 'Мария',
      userSurname: 'Соколова',
      avatarUrl: '',
      city: { id: '', name: 'Москва', countryName: '', timezone: '' },
      isFollowing: true,
    },
    {
      id: 'a0a00000-0000-4000-8000-000000000002',
      username: 'Даниил',
      userSurname: 'Орлов',
      avatarUrl: '',
      city: { id: '', name: 'Санкт-Петербург', countryName: '', timezone: '' },
      isFollowing: false,
    },
  ];
}

function getFallbackFollowing(): FollowUser[] {
  return [
    {
      id: 'a0a00000-0000-4000-8000-000000000003',
      username: 'Елена',
      userSurname: 'Павлова',
      avatarUrl: '',
      city: { id: '', name: 'Казань', countryName: '', timezone: '' },
      isFollowing: true,
    },
    {
      id: 'a0a00000-0000-4000-8000-000000000004',
      username: 'Илья',
      userSurname: 'Киселев',
      avatarUrl: '',
      city: { id: '', name: 'Екатеринбург', countryName: '', timezone: '' },
      isFollowing: true,
    },
  ];
}

export async function profilePage({ navigate }: RouteContext): Promise<RouteView> {
  const me = await getMeOrNull().catch(() => null);
  const displayName = getHeaderUserDisplayName(me) || 'Пользователь';
  const fallbackEvents = getFallbackEvents();
  const fallbackFollowers = getFallbackFollowers();
  const fallbackFollowing = getFallbackFollowing();

  const [myEventsResult, favoriteEventsResult, followersResult, followingResult] = await Promise.allSettled([
    me?.id
      ? getEvents({ authorId: String(me.id), limit: 4, offset: 0 })
      : Promise.resolve({ items: fallbackEvents }),
    getEvents({ limit: 4, offset: 4 }),
    getMyFollowers(100, 0),
    getMyFollowing(100, 0),
  ]);

  const myEvents = myEventsResult.status === 'fulfilled' && Array.isArray(myEventsResult.value?.items)
    ? myEventsResult.value.items
    : fallbackEvents;
  const favoriteEvents = favoriteEventsResult.status === 'fulfilled'
    && Array.isArray(favoriteEventsResult.value?.items)
    ? favoriteEventsResult.value.items
    : fallbackEvents;
  const followers = followersResult.status === 'fulfilled'
    && Array.isArray(followersResult.value?.items)
    ? followersResult.value.items
    : fallbackFollowers;
  const following = followingResult.status === 'fulfilled'
    && Array.isArray(followingResult.value?.items)
    ? followingResult.value.items
    : fallbackFollowing;

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
      myEvents: followers.length,
      favorites: following.length,
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
      const followsModal = root.querySelector<HTMLElement>('[data-role="profile-follows-modal"]');
      const followsList = root.querySelector<HTMLElement>('[data-role="profile-follows-list"]');
      const openFollowsButtons = Array.from(
        root.querySelectorAll<HTMLButtonElement>('[data-role="profile-open-follows"]'),
      );
      const followsTabButtons = Array.from(
        root.querySelectorAll<HTMLButtonElement>('[data-role="profile-follows-tab"]'),
      );
      const closeFollowsButtons = Array.from(
        root.querySelectorAll<HTMLElement>('[data-role="profile-follows-close"]'),
      );
      const followersCountNode = root.querySelector<HTMLElement>('[data-role="profile-open-follows"][data-tab="followers"] .profile-stat__value');
      const followingCountNode = root.querySelector<HTMLElement>('[data-role="profile-open-follows"][data-tab="following"] .profile-stat__value');
      const detachCityPicker = attachHeaderCityPicker(root, { navigate, targetPath: '/events' });
      let followersState = Array.isArray(followers) ? [...followers] : [];
      let followingState = Array.isArray(following) ? [...following] : [];
      let activeFollowTab: 'followers' | 'following' = 'followers';
      let pendingFollowUserId = '';

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

      const syncFollowCounters = (): void => {
        if (followersCountNode instanceof HTMLElement) {
          followersCountNode.textContent = String(followersState.length);
        }
        if (followingCountNode instanceof HTMLElement) {
          followingCountNode.textContent = String(followingState.length);
        }
      };

      const setFollowTab = (tab: 'followers' | 'following'): void => {
        activeFollowTab = tab;
        followsTabButtons.forEach((button) => {
          const isActive = String(button.dataset.tab || '') === tab;
          button.classList.toggle('profile-follows-modal__tab--active', isActive);
        });
      };

      const ensureFollowingState = (userId: string, shouldFollow: boolean, user: FollowUser): void => {
        const index = followingState.findIndex((item) => String(item.id || '') === userId);

        if (shouldFollow) {
          if (index === -1) {
            followingState = [{ ...user, isFollowing: true }, ...followingState];
          } else {
            followingState[index] = { ...followingState[index], isFollowing: true };
          }
          return;
        }

        if (index >= 0) {
          followingState.splice(index, 1);
          followingState = [...followingState];
        }
      };

      const renderFollows = (): void => {
        if (!(followsList instanceof HTMLElement)) {
          return;
        }

        const items = activeFollowTab === 'followers' ? followersState : followingState;
        followsList.innerHTML = '';

        if (!items.length) {
          const empty = document.createElement('p');
          empty.className = 'profile-follows-modal__empty';
          empty.textContent = activeFollowTab === 'followers'
            ? 'Пока нет подписчиков'
            : 'Пока нет подписок';
          followsList.append(empty);
          return;
        }

        items.forEach((item) => {
          const userId = String(item.id || '').trim();
          const row = document.createElement('article');
          row.className = 'profile-follows-item';
          row.dataset.userId = userId;

          if (item.avatarUrl) {
            const avatar = document.createElement('img');
            avatar.className = 'profile-follows-item__avatar';
            avatar.src = item.avatarUrl;
            avatar.alt = getFollowDisplayName(item);
            row.append(avatar);
          } else {
            const fallbackAvatar = document.createElement('div');
            fallbackAvatar.className = 'profile-follows-item__avatar-fallback';
            fallbackAvatar.textContent = getUserInitials(getFollowDisplayName(item));
            row.append(fallbackAvatar);
          }

          const info = document.createElement('div');
          info.className = 'profile-follows-item__info';
          const name = document.createElement('div');
          name.className = 'profile-follows-item__name';
          name.textContent = getFollowDisplayName(item);
          const city = document.createElement('div');
          city.className = 'profile-follows-item__city';
          city.textContent = String(item.city?.name || '').trim() || 'Город не указан';
          info.append(name, city);
          row.append(info);

          if (me?.id && userId && String(me.id) !== userId) {
            const isFollowingUser = Boolean(item.isFollowing);
            const actionButton = document.createElement('button');
            actionButton.type = 'button';
            actionButton.className = `profile-follows-item__button${isFollowingUser ? ' profile-follows-item__button--ghost' : ''}`;
            actionButton.dataset.role = 'profile-follow-toggle';
            actionButton.dataset.userId = userId;
            actionButton.dataset.following = isFollowingUser ? '1' : '0';
            actionButton.disabled = pendingFollowUserId === userId;
            actionButton.textContent = isFollowingUser ? 'Отписаться' : 'Подписаться';
            row.append(actionButton);
          }

          followsList.append(row);
        });
      };

      const openFollowsModal = (tab: 'followers' | 'following'): void => {
        if (!(followsModal instanceof HTMLElement)) {
          return;
        }

        setFollowTab(tab);
        renderFollows();
        followsModal.hidden = false;
        document.body.style.overflow = 'hidden';
      };

      const closeFollowsModal = (): void => {
        if (!(followsModal instanceof HTMLElement)) {
          return;
        }

        followsModal.hidden = true;
        document.body.style.overflow = '';
      };

      const handleOpenFollowsClick = (event: Event): void => {
        const target = event.currentTarget;
        if (!(target instanceof HTMLButtonElement)) {
          return;
        }

        const tab = String(target.dataset.tab || '') === 'following' ? 'following' : 'followers';
        openFollowsModal(tab);
      };

      const handleFollowsTabClick = (event: Event): void => {
        const target = event.currentTarget;
        if (!(target instanceof HTMLButtonElement)) {
          return;
        }

        const tab = String(target.dataset.tab || '') === 'following' ? 'following' : 'followers';
        setFollowTab(tab);
        renderFollows();
      };

      const handleFollowsCloseClick = (): void => {
        closeFollowsModal();
      };

      const handleWindowKeydown = (event: KeyboardEvent): void => {
        if (event.key !== 'Escape') {
          return;
        }

        if (followsModal instanceof HTMLElement && !followsModal.hidden) {
          closeFollowsModal();
        }
      };

      const handleFollowsListClick = async (event: Event): Promise<void> => {
        const target = event.target;
        if (!(target instanceof Element)) {
          return;
        }

        const button = target.closest<HTMLButtonElement>('[data-role="profile-follow-toggle"]');
        if (!(button instanceof HTMLButtonElement)) {
          return;
        }

        const userId = String(button.dataset.userId || '').trim();
        if (!userId || pendingFollowUserId) {
          return;
        }

        const isFollowingUser = button.dataset.following === '1';
        pendingFollowUserId = userId;
        renderFollows();

        try {
          if (isFollowingUser) {
            await unfollowUser(userId);
          } else {
            await followUser(userId);
          }

          followersState = followersState.map((item) => (
            String(item.id || '') === userId
              ? { ...item, isFollowing: !isFollowingUser }
              : item
          ));

          const sourceUser = followersState.find((item) => String(item.id || '') === userId)
            || followingState.find((item) => String(item.id || '') === userId)
            || {
              id: userId,
              username: 'Пользователь',
              isFollowing: !isFollowingUser,
            } as FollowUser;

          ensureFollowingState(userId, !isFollowingUser, sourceUser);
          syncFollowCounters();
          renderFollows();
        } catch (error) {
          const message = error instanceof Error
            ? error.message
            : 'Не удалось изменить подписку';
          showToast(message, { type: 'error' });
        } finally {
          pendingFollowUserId = '';
          renderFollows();
        }
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
      openFollowsButtons.forEach((button) => button.addEventListener('click', handleOpenFollowsClick));
      followsTabButtons.forEach((button) => button.addEventListener('click', handleFollowsTabClick));
      closeFollowsButtons.forEach((button) => button.addEventListener('click', handleFollowsCloseClick));
      if (followsList instanceof HTMLElement) {
        followsList.addEventListener('click', handleFollowsListClick);
      }
      window.addEventListener('keydown', handleWindowKeydown);
      syncFollowCounters();

      return () => {
        detachCityPicker();
        detachHeaderSuggestions();
        document.body.style.overflow = '';

        if (headerSearchForm instanceof HTMLFormElement) {
          headerSearchForm.removeEventListener('submit', handleHeaderSearchSubmit);
        }

        if (editButton instanceof HTMLButtonElement) {
          editButton.removeEventListener('click', handleEditClick);
        }

        openFollowsButtons.forEach((button) => button.removeEventListener('click', handleOpenFollowsClick));
        followsTabButtons.forEach((button) => button.removeEventListener('click', handleFollowsTabClick));
        closeFollowsButtons.forEach((button) => button.removeEventListener('click', handleFollowsCloseClick));
        if (followsList instanceof HTMLElement) {
          followsList.removeEventListener('click', handleFollowsListClick);
        }
        window.removeEventListener('keydown', handleWindowKeydown);
      };
    },
  };
}
