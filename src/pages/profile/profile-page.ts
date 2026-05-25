import { getMeOrNull } from '../../api/profile.api.js';
import { getEvents } from '../../api/events.api.js';
import { getMyFavorites } from '../../api/favorites.api.js';
import { getTags } from '../../api/tags.api.js';
import {
  followUser,
  getMyFollowers,
  getMyFollowing,
  unfollowUser,
} from '../../api/follows.api.js';
import { searchUsers } from '../../api/search.api.js';
import './profile.css';
import '../../modules/profile/profile-aside.css';
import '../../modules/profile/profile-overview.css';
import { attachHeaderCityPicker } from '../../components/header/header-city-picker.js';
import { attachHeaderSearchSuggestions } from '../../components/header/header-search-suggestions.js';
import { getHeaderUserDisplayName } from '../../components/header/header-user.js';
import { renderEventCard } from '../../components/event-card/event-card.js';
import { showToast } from '../../app/ui/toast.js';
import { getUserErrorMessage } from '../../api/errors.js';
import { renderTemplate } from '../../app/templates/renderer.js';
import { formatEventDateOrPeriod } from '../../modules/events/common/event-date-label.js';
import { isVisibleEvent } from '../../modules/events/common/event-visibility.js';
import type { EventCard, FollowUser } from '../../types/api.js';
import type { RouteContext, RouteView } from '../../types/router.js';

const PROFILE_PREVIEW_STORAGE_PREFIX = 'cityhawk.profile-preview.';

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

function mapEventToProfileCard(item: Partial<EventCard> = {}): string {
  const tags = Array.isArray(item.tags)
    ? item.tags.map((tag) => String(tag?.name || '').trim()).filter(Boolean).slice(0, 3)
    : [];
  const placeText = [
    String(item.nextSession?.placeName || item.nextSession?.place?.name || '').trim(),
    String(item.nextSession?.place?.addressLine || '').trim(),
  ].filter(Boolean).join(', ') || 'Место уточняется';

  return renderEventCard({
    id: item.id || '',
    imageUrl: item.coverImageUrl || '/public/static/img/concert.jpeg',
    title: item.title || 'Без названия',
    textLines: [formatEventDateOrPeriod(item), placeText],
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

function saveProfilePreview(user: Partial<FollowUser>): void {
  const userId = String(user.id || '').trim();
  if (!userId) {
    return;
  }

  try {
    window.sessionStorage.setItem(
      `${PROFILE_PREVIEW_STORAGE_PREFIX}${userId}`,
      JSON.stringify({
        id: userId,
        username: String(user.username || '').trim(),
        userSurname: String(user.userSurname || '').trim(),
        avatarUrl: String(user.avatarUrl || '').trim(),
        city: user.city || null,
        isFollowing: Boolean(user.isFollowing),
      }),
    );
  } catch {
    // ignore storage errors
  }
}

function loadProfilePreview(userId: string): FollowUser | null {
  if (!userId) {
    return null;
  }

  try {
    const raw = window.sessionStorage.getItem(`${PROFILE_PREVIEW_STORAGE_PREFIX}${userId}`);
    if (!raw) {
      return null;
    }

    return JSON.parse(raw) as FollowUser;
  } catch {
    return null;
  }
}

function normalizeInterestValues(raw: unknown): string[] {
  if (Array.isArray(raw)) {
    return raw
      .map((item) => {
        if (typeof item === 'string' || typeof item === 'number') {
          return String(item).trim();
        }

        if (item && typeof item === 'object') {
          const source = item as Record<string, unknown>;
          const id = String(source.id || source.tagId || '').trim();
          const name = String(source.name || source.label || '').trim();
          return id || name;
        }

        return '';
      })
      .filter(Boolean);
  }

  if (typeof raw === 'string') {
    return raw
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean);
  }

  return [];
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
  const searchParams = new URLSearchParams(window.location.search);
  const showAllFavorites = String(searchParams.get('favorites') || '').trim() === 'all';
  const favoriteLimit = showAllFavorites ? 24 : 4;
  const viewedUserId = String(searchParams.get('userId') || '').trim();

  const me = await getMeOrNull().catch(() => null);
  const isOwnProfile = !viewedUserId || String(me?.id || '').trim() === viewedUserId;
  const previewUser = !isOwnProfile ? loadProfilePreview(viewedUserId) : null;
  const profileSource = isOwnProfile ? me : previewUser;
  const displayName = getHeaderUserDisplayName(profileSource) || 'Пользователь';
  const fallbackEvents = getFallbackEvents();
  const fallbackFollowers = getFallbackFollowers();
  const fallbackFollowing = getFallbackFollowing();

  const [myEventsResult, favoriteEventsResult, followersResult, followingResult, tagsResult] = await Promise.allSettled([
    (isOwnProfile ? me?.id : viewedUserId)
      ? getEvents({ authorId: String(isOwnProfile ? me?.id : viewedUserId), limit: 4, offset: 0 })
      : Promise.resolve({ items: fallbackEvents }),
    isOwnProfile ? getMyFavorites(favoriteLimit, 0) : Promise.resolve({ items: [] }),
    isOwnProfile ? getMyFollowers(100, 0) : Promise.resolve({ items: [] }),
    isOwnProfile ? getMyFollowing(100, 0) : Promise.resolve({ items: [] }),
    getTags(),
  ]);

  const myEvents = myEventsResult.status === 'fulfilled' && Array.isArray(myEventsResult.value?.items)
    ? myEventsResult.value.items.filter(isVisibleEvent)
    : fallbackEvents;
  const favoriteEvents = favoriteEventsResult.status === 'fulfilled'
    && Array.isArray(favoriteEventsResult.value?.items)
    ? favoriteEventsResult.value.items.filter(isVisibleEvent)
    : [];
  const followers = followersResult.status === 'fulfilled'
    && Array.isArray(followersResult.value?.items)
    ? followersResult.value.items
    : fallbackFollowers;
  const following = followingResult.status === 'fulfilled'
    && Array.isArray(followingResult.value?.items)
    ? followingResult.value.items
    : fallbackFollowing;
  const tagItems = tagsResult.status === 'fulfilled' && Array.isArray(tagsResult.value?.items)
    ? tagsResult.value.items
    : [];

  const interestIdToLabel = new Map<string, string>(
    tagItems
      .map((tag) => [String(tag?.id || '').trim(), String(tag?.name || '').trim()] as const)
      .filter(([id, name]) => Boolean(id && name)),
  );
  const rawInterestValues = normalizeInterestValues((profileSource as { interestTagIds?: unknown; interests?: unknown } | null)?.interestTagIds)
    .concat(normalizeInterestValues((profileSource as { interestTagIds?: unknown; interests?: unknown } | null)?.interests));
  const interestLabels = Array.from(new Set(
    rawInterestValues
      .map((value) => interestIdToLabel.get(value) || value)
      .map((value) => String(value || '').trim())
      .filter(Boolean),
  ));
  const bio = String((profileSource as { bio?: string } | null)?.bio || '').trim();

  const user = {
    displayName,
    name: displayName,
    firstName: profileSource?.username || 'Не указано',
    lastName: profileSource?.userSurname || '',
    email: isOwnProfile ? me?.email || 'Не указан' : 'Скрыт',
    birthdateLabel: isOwnProfile ? formatBirthday(me?.birthday || '') : 'Скрыта',
    cityName: profileSource?.city?.name || 'Не указан',
    initials: getUserInitials(displayName),
    avatarUrl: profileSource?.avatarUrl || '',
    bio: bio || 'Описание пока не добавлено',
    tags: interestLabels,
  };

  const html = renderTemplate('profile', {
    user,
    headerSearch: { query: '' },
    myEventCards: myEvents.slice(0, 4).map(mapEventToProfileCard),
    favoriteEventCards: favoriteEvents.slice(0, favoriteLimit).map(mapEventToProfileCard),
    favoriteMoreHref: showAllFavorites ? '/profile' : '/profile?favorites=all',
    favoriteMoreLabel: showAllFavorites ? 'свернуть' : 'показать ещё...',
    stats: {
      myEvents: followers.length,
      favorites: following.length,
    },
    isOwnProfile,
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
      const followsSearchInput = root.querySelector<HTMLInputElement>('[data-role="profile-follows-search"]');
      const openFriendsButton = root.querySelector<HTMLButtonElement>('[data-role="profile-open-friends"]');
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
      let activeFollowTab: 'discover' | 'followers' | 'following' = 'followers';
      let followsSearchQuery = '';
      let searchResults: FollowUser[] = [];
      let searchRequestSeq = 0;
      let searchDebounceTimer: number | null = null;
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

      const setSearchPlaceholder = (): void => {
        if (!(followsSearchInput instanceof HTMLInputElement)) {
          return;
        }
        followsSearchInput.placeholder = activeFollowTab === 'discover'
          ? 'Найти друзей по имени'
          : 'Поиск по имени или городу';
      };

      const setFollowTab = (tab: 'discover' | 'followers' | 'following'): void => {
        activeFollowTab = tab;
        followsTabButtons.forEach((button) => {
          const isActive = String(button.dataset.tab || '') === tab;
          button.classList.toggle('profile-follows-modal__tab--active', isActive);
        });
        setSearchPlaceholder();
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

      const findUserById = (userId: string): FollowUser | null => (
        followersState.find((item) => String(item.id || '').trim() === userId)
        || followingState.find((item) => String(item.id || '').trim() === userId)
        || searchResults.find((item) => String(item.id || '').trim() === userId)
        || null
      );

      const renderFollows = (): void => {
        if (!(followsList instanceof HTMLElement)) {
          return;
        }

        const sourceItems = activeFollowTab === 'followers'
          ? followersState
          : activeFollowTab === 'following'
            ? followingState
            : [];
        const normalizedQuery = followsSearchQuery.trim().toLowerCase();
        const localFilteredItems = activeFollowTab === 'discover'
          ? []
          : normalizedQuery
          ? sourceItems.filter((item) => {
              const name = getFollowDisplayName(item).toLowerCase();
              const city = String(item.city?.name || '').trim().toLowerCase();
              return name.includes(normalizedQuery) || city.includes(normalizedQuery);
            })
          : sourceItems;
        const items = activeFollowTab === 'discover' ? searchResults : localFilteredItems;
        followsList.innerHTML = '';

        if (!items.length) {
          const empty = document.createElement('p');
          empty.className = 'profile-follows-modal__empty';
          if (activeFollowTab === 'discover') {
            empty.textContent = normalizedQuery
              ? 'По запросу никого не найдено'
              : 'Введи имя, чтобы найти друзей';
          } else {
            empty.textContent = normalizedQuery
              ? 'Ничего не найдено по этому запросу'
              : activeFollowTab === 'followers'
                ? 'Пока нет подписчиков'
                : 'Пока нет подписок';
          }
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

          const actions = document.createElement('div');
          actions.className = 'profile-follows-item__actions';

          if (userId) {
            const profileButton = document.createElement('button');
            profileButton.type = 'button';
            profileButton.className = 'profile-follows-item__button profile-follows-item__button--profile ui-button ui-button--ghost ui-button--pill';
            profileButton.dataset.role = 'profile-view-user';
            profileButton.dataset.userId = userId;
            profileButton.textContent = 'Профиль';
            actions.append(profileButton);
          }

          if (me?.id && userId && String(me.id) !== userId) {
            const isFollowingUser = Boolean(item.isFollowing);
            const actionButton = document.createElement('button');
            actionButton.type = 'button';
            actionButton.className = `profile-follows-item__button ui-button ui-button--pill ${
              isFollowingUser ? 'ui-button--ghost profile-follows-item__button--ghost' : 'ui-button--primary'
            }`;
            actionButton.dataset.role = 'profile-follow-toggle';
            actionButton.dataset.userId = userId;
            actionButton.dataset.following = isFollowingUser ? '1' : '0';
            actionButton.disabled = pendingFollowUserId === userId;
            actionButton.textContent = isFollowingUser ? 'Отписаться' : 'Подписаться';
            actions.append(actionButton);
          }

          if (actions.childElementCount > 0) {
            row.append(actions);
          }

          followsList.append(row);
        });
      };

      const openFollowsModal = (tab: 'discover' | 'followers' | 'following'): void => {
        if (!(followsModal instanceof HTMLElement)) {
          return;
        }

        setFollowTab(tab);
        followsSearchQuery = '';
        searchResults = [];
        if (searchDebounceTimer !== null) {
          window.clearTimeout(searchDebounceTimer);
          searchDebounceTimer = null;
        }
        if (followsSearchInput instanceof HTMLInputElement) {
          followsSearchInput.value = '';
        }
        renderFollows();
        followsModal.hidden = false;
        document.body.style.overflow = 'hidden';
      };

      const openFriendsModal = (): void => {
        openFollowsModal('discover');
        if (followsSearchInput instanceof HTMLInputElement) {
          followsSearchInput.focus();
        }
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

        const tabName = String(target.dataset.tab || '').trim();
        const tab = tabName === 'following'
          ? 'following'
          : tabName === 'discover'
            ? 'discover'
            : 'followers';
        openFollowsModal(tab);
      };

      const handleFollowsTabClick = (event: Event): void => {
        const target = event.currentTarget;
        if (!(target instanceof HTMLButtonElement)) {
          return;
        }

        const tabName = String(target.dataset.tab || '').trim();
        const tab = tabName === 'following'
          ? 'following'
          : tabName === 'discover'
            ? 'discover'
            : 'followers';
        setFollowTab(tab);
        renderFollows();
      };

      const handleFollowsCloseClick = (): void => {
        closeFollowsModal();
      };

      const handleFollowsSearchInput = (): void => {
        if (!(followsSearchInput instanceof HTMLInputElement)) {
          return;
        }
        followsSearchQuery = String(followsSearchInput.value || '');
        const query = followsSearchQuery.trim();

        if (searchDebounceTimer !== null) {
          window.clearTimeout(searchDebounceTimer);
          searchDebounceTimer = null;
        }

        if (activeFollowTab !== 'discover') {
          searchResults = [];
          renderFollows();
          return;
        }

        if (!query) {
          searchResults = [];
          renderFollows();
          return;
        }
        if (query.length < 2) {
          searchResults = [];
          renderFollows();
          return;
        }

        searchDebounceTimer = window.setTimeout(async () => {
          const requestId = ++searchRequestSeq;
          try {
            const users = await searchUsers(query, 10);
            if (requestId !== searchRequestSeq) {
              return;
            }

            searchResults = users
              .map((item) => {
                const userId = String(item.id || '').trim();
                const isFollowingFromState = followingState.some((f) => String(f.id || '') === userId);
                return { ...item, isFollowing: isFollowingFromState || Boolean(item.isFollowing) };
              });
          } catch {
            searchResults = [];
          } finally {
            if (requestId === searchRequestSeq) {
              renderFollows();
            }
          }
        }, 280);
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

        const profileButton = target.closest<HTMLButtonElement>('[data-role="profile-view-user"]');
        if (profileButton instanceof HTMLButtonElement) {
          const userId = String(profileButton.dataset.userId || '').trim();
          if (!userId) {
            return;
          }

          const selectedUser = findUserById(userId);
          if (selectedUser) {
            saveProfilePreview(selectedUser);
          }

          closeFollowsModal();
          navigate(String(me?.id || '').trim() === userId ? '/profile' : `/profile?userId=${encodeURIComponent(userId)}`);
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
          searchResults = searchResults.map((item) => (
            String(item.id || '') === userId
              ? { ...item, isFollowing: !isFollowingUser }
              : item
          ));
          syncFollowCounters();
          renderFollows();
        } catch (error) {
          showToast(getUserErrorMessage(error, 'Не удалось изменить подписку'), { type: 'error' });
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
      if (openFriendsButton instanceof HTMLButtonElement) {
        openFriendsButton.addEventListener('click', openFriendsModal);
      }
      openFollowsButtons.forEach((button) => button.addEventListener('click', handleOpenFollowsClick));
      followsTabButtons.forEach((button) => button.addEventListener('click', handleFollowsTabClick));
      closeFollowsButtons.forEach((button) => button.addEventListener('click', handleFollowsCloseClick));
      if (followsSearchInput instanceof HTMLInputElement) {
        followsSearchInput.addEventListener('input', handleFollowsSearchInput);
      }
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
        if (openFriendsButton instanceof HTMLButtonElement) {
          openFriendsButton.removeEventListener('click', openFriendsModal);
        }

        openFollowsButtons.forEach((button) => button.removeEventListener('click', handleOpenFollowsClick));
        followsTabButtons.forEach((button) => button.removeEventListener('click', handleFollowsTabClick));
        closeFollowsButtons.forEach((button) => button.removeEventListener('click', handleFollowsCloseClick));
        if (followsSearchInput instanceof HTMLInputElement) {
          followsSearchInput.removeEventListener('input', handleFollowsSearchInput);
        }
        if (searchDebounceTimer !== null) {
          window.clearTimeout(searchDebounceTimer);
          searchDebounceTimer = null;
        }
        if (followsList instanceof HTMLElement) {
          followsList.removeEventListener('click', handleFollowsListClick);
        }
        window.removeEventListener('keydown', handleWindowKeydown);
      };
    },
  };
}
