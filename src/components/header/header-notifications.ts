import { updateInvitationStatus } from '../../api/invitations.api.js';
import { getMyNotifications, markNotificationRead } from '../../api/notifications.api.js';
import type { NotificationItem } from '../../types/api.js';

type NotificationFilter = 'all' | 'unread' | 'read';

function formatNotificationTime(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '';
  }

  const diffMs = Date.now() - date.getTime();
  const minuteMs = 60 * 1000;
  const hourMs = 60 * minuteMs;
  const dayMs = 24 * hourMs;

  if (diffMs < hourMs) {
    return `${Math.max(1, Math.round(diffMs / minuteMs))} мин назад`;
  }
  if (diffMs < dayMs) {
    return `${Math.round(diffMs / hourMs)} ч назад`;
  }

  return `${Math.round(diffMs / dayMs)} дн назад`;
}

function getInitials(value: string): string {
  return value
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || '')
    .join('')
    || 'CH';
}

function createTextElement(tagName: string, className: string, text: string): HTMLElement {
  const node = document.createElement(tagName);
  node.className = className;
  node.textContent = text;
  return node;
}

function createEventTitleLink(item: NotificationItem): HTMLElement | null {
  const eventId = String(item.event?.id || '').trim();
  const eventTitle = String(item.event?.title || '').trim();

  if (!eventId || !eventTitle) {
    return null;
  }

  const link = document.createElement('a');
  link.className = 'site-header__notification-event-link';
  link.href = `/events/${encodeURIComponent(eventId)}`;
  link.textContent = eventTitle;

  return link;
}

function createNotificationTitle(item: NotificationItem): HTMLElement {
  const title = document.createElement('h3');
  title.className = 'site-header__notification-title';

  const eventLink = createEventTitleLink(item);
  const actorName = item.actor?.displayName || 'Пользователь';

  if (!eventLink) {
    title.textContent = item.title || 'Уведомление';
    return title;
  }

  if (item.type === 'event_invitation') {
    title.append(
      document.createTextNode(`${actorName} пригласил(а) вас на `),
      eventLink,
    );
    return title;
  }

  if (item.type === 'invitation_accepted') {
    title.append(
      document.createTextNode(`${actorName} принял(а) приглашение на `),
      eventLink,
    );
    return title;
  }

  if (item.type === 'invitation_declined') {
    title.append(
      document.createTextNode(`${actorName} отклонил(а) приглашение на `),
      eventLink,
    );
    return title;
  }

  title.textContent = item.title || 'Уведомление';

  return title;
}

function renderNotification(item: NotificationItem): HTMLElement {
  const article = document.createElement('article');
  article.className = `site-header__notification${item.isRead ? '' : ' site-header__notification--unread'}`;
  article.dataset.notificationId = item.id;

  const actorName = item.actor?.displayName || 'CityHawk';
  const avatar = document.createElement('span');
  avatar.className = 'site-header__notification-avatar site-header__notification-avatar--cityhawk';
  avatar.setAttribute('aria-hidden', 'true');

  if (item.actor?.avatarUrl) {
    const image = document.createElement('img');
    image.src = item.actor.avatarUrl;
    image.alt = '';
    avatar.textContent = '';
    avatar.append(image);
  } else {
    avatar.textContent = item.type === 'system' ? 'CityHawk' : getInitials(actorName);
  }

  const body = document.createElement('div');
  body.className = 'site-header__notification-body';

  const topLine = document.createElement('div');
  topLine.className = 'site-header__notification-topline';
  topLine.append(
    createNotificationTitle(item),
    createTextElement('time', 'site-header__notification-time', formatNotificationTime(item.createdAt)),
  );
  body.append(topLine);

  if (item.message) {
    body.append(createTextElement('p', 'site-header__notification-text', item.message));
  }

  const eventTitle = String(item.event?.title || '').trim();
  const titleText = String(item.title || '').trim();
  const titleAlreadyIncludesEventLink = item.type === 'event_invitation'
    || item.type === 'invitation_accepted'
    || item.type === 'invitation_declined';
  const shouldShowEventTitle = Boolean(eventTitle)
    && !titleAlreadyIncludesEventLink
    && !titleText.includes(eventTitle);

  if (shouldShowEventTitle) {
    body.append(createTextElement('p', 'site-header__notification-title site-header__notification-title--small', item.event.title));
  }

  if (item.event?.dateText) {
    body.append(createTextElement('p', 'site-header__notification-meta', item.event.dateText));
  }

  if (item.event?.placeText) {
    body.append(createTextElement('p', 'site-header__notification-meta', item.event.placeText));
  }

  if (item.invitation?.id && item.invitation.status === 'pending') {
    const actions = document.createElement('div');
    actions.className = 'site-header__notification-actions';

    const acceptButton = document.createElement('button');
    acceptButton.type = 'button';
    acceptButton.className = 'site-header__notification-action site-header__notification-action--primary';
    acceptButton.dataset.action = 'header-notification-invitation';
    acceptButton.dataset.invitationId = item.invitation.id;
    acceptButton.dataset.invitationStatus = 'accepted';
    acceptButton.textContent = 'Принять';

    const declineButton = document.createElement('button');
    declineButton.type = 'button';
    declineButton.className = 'site-header__notification-action';
    declineButton.dataset.action = 'header-notification-invitation';
    declineButton.dataset.invitationId = item.invitation.id;
    declineButton.dataset.invitationStatus = 'declined';
    declineButton.textContent = 'Отклонить';

    actions.append(acceptButton, declineButton);
    body.append(actions);
  }

  article.append(avatar, body);
  return article;
}

export function attachHeaderNotifications(root: ParentNode): () => void {
  const host = root.querySelector<HTMLElement>('[data-role="header-notifications"]');
  const trigger = root.querySelector<HTMLButtonElement>('[data-role="header-notifications-trigger"]');
  const panel = root.querySelector<HTMLElement>('[data-role="header-notifications-panel"]');
  const list = root.querySelector<HTMLElement>('[data-role="header-notifications-list"]');
  const count = root.querySelector<HTMLElement>('[data-role="header-notifications-count"]');
  const tabs = Array.from(root.querySelectorAll<HTMLButtonElement>('[data-role="header-notifications-tab"]'));

  if (!(host instanceof HTMLElement)
    || !(trigger instanceof HTMLButtonElement)
    || !(panel instanceof HTMLElement)
    || !(list instanceof HTMLElement)) {
    return () => {};
  }

  let disposed = false;
  let activeType: NotificationFilter = 'all';

  const getFilteredItems = (items: NotificationItem[]): NotificationItem[] => {
    if (activeType === 'unread') {
      return items.filter((item) => !item.isRead);
    }

    if (activeType === 'read') {
      return items.filter((item) => item.isRead);
    }

    return items;
  };

  const markSeenNotificationsRead = async (items: NotificationItem[]): Promise<Set<string>> => {
    const notificationIds = items
      .filter((item) => (
        (item.type === 'invitation_accepted' || item.type === 'invitation_declined')
        && !item.isRead
      ))
      .map((item) => String(item.id || '').trim())
      .filter(Boolean);

    if (notificationIds.length === 0) {
      return new Set();
    }

    await Promise.all(notificationIds.map(async (notificationId) => {
      await markNotificationRead(notificationId).catch(() => {});
    }));

    return new Set(notificationIds);
  };

  const open = (): void => {
    host.classList.add('site-header__notifications--open');
    trigger.setAttribute('aria-expanded', 'true');
    void load(true);
  };

  const close = (): void => {
    host.classList.remove('site-header__notifications--open');
    trigger.setAttribute('aria-expanded', 'false');
  };

  const toggle = (): void => {
    if (host.classList.contains('site-header__notifications--open')) {
      close();
      return;
    }
    open();
  };

  const load = async (markSeenAsRead = false) => {
    list.innerHTML = '';
    list.append(createTextElement('p', 'site-header__notifications-empty', 'Загрузка уведомлений...'));

    try {
      const response = await getMyNotifications({
        type: 'all',
        unreadOnly: activeType === 'unread' ? true : undefined,
        limit: 100,
      });
      if (disposed) {
        return;
      }

      const items = Array.isArray(response.items) ? response.items : [];
      const autoReadIds = markSeenAsRead
        ? await markSeenNotificationsRead(items)
        : new Set<string>();
      if (disposed) {
        return;
      }

      const normalizedItems = items.map((item) => (
        autoReadIds.has(String(item.id || '').trim())
          ? { ...item, isRead: true }
          : item
      ));
      const filteredItems = getFilteredItems(normalizedItems);
      list.innerHTML = '';
      if (filteredItems.length === 0) {
        list.append(createTextElement('p', 'site-header__notifications-empty', 'Уведомлений пока нет'));
      } else {
        filteredItems.forEach((item) => list.append(renderNotification(item)));
      }

      if (count instanceof HTMLElement) {
        const unreadCount = normalizedItems.filter((item) => !item.isRead).length;
        count.textContent = String(unreadCount);
        count.hidden = unreadCount === 0;
      }
    } catch {
      list.innerHTML = '';
      list.append(createTextElement('p', 'site-header__notifications-empty', 'Уведомлений пока нет'));

      if (count instanceof HTMLElement) {
        count.hidden = true;
      }
    }
  };

  const onTabClick = (event: Event) => {
    const button = event.currentTarget;
    if (!(button instanceof HTMLButtonElement)) {
      return;
    }

    const nextType = String(button.dataset.notificationFilter || 'all') as NotificationFilter;
    activeType = nextType;
    tabs.forEach((tab) => {
      tab.classList.toggle('site-header__notifications-tab--active', tab === button);
    });
    void load(host.classList.contains('site-header__notifications--open'));
  };

  const onTriggerClick = (event: Event) => {
    event.preventDefault();
    event.stopPropagation();
    toggle();
  };

  const onListClick = async (event: Event) => {
    const target = event.target;
    if (!(target instanceof HTMLElement)) {
      return;
    }

    const invitationButton = target.closest<HTMLButtonElement>('[data-action="header-notification-invitation"]');
    if (invitationButton instanceof HTMLButtonElement) {
      const invitationId = String(invitationButton.dataset.invitationId || '');
      const status = invitationButton.dataset.invitationStatus === 'declined' ? 'declined' : 'accepted';
      const notification = invitationButton.closest<HTMLElement>('[data-notification-id]');
      const notificationId = String(notification?.dataset.notificationId || '');
      if (!invitationId) {
        return;
      }

      invitationButton.disabled = true;
      try {
        await updateInvitationStatus(invitationId, status);
        if (notificationId) {
          await markNotificationRead(notificationId).catch(() => {});
        }
        await load();
      } catch {
        invitationButton.disabled = false;
      }
      return;
    }

    const notification = target.closest<HTMLElement>('[data-notification-id]');
    const notificationId = String(notification?.dataset.notificationId || '');
    if (notificationId) {
      try {
        await markNotificationRead(notificationId);
        notification?.classList.remove('site-header__notification--unread');
      } catch {
        // Non-blocking; opening notification content should not fail because read marker failed.
      }
    }
  };

  const onDocumentClick = (event: MouseEvent) => {
    const target = event.target;
    if (!(target instanceof Node)) {
      return;
    }

    if (!host.contains(target)) {
      close();
    }
  };

  const onWindowKeydown = (event: KeyboardEvent) => {
    if (event.key === 'Escape') {
      close();
    }
  };

  trigger.addEventListener('click', onTriggerClick);
  tabs.forEach((tab) => tab.addEventListener('click', onTabClick));
  list.addEventListener('click', onListClick);
  document.addEventListener('click', onDocumentClick);
  window.addEventListener('keydown', onWindowKeydown);
  void load(false);

  return () => {
    disposed = true;
    trigger.removeEventListener('click', onTriggerClick);
    tabs.forEach((tab) => tab.removeEventListener('click', onTabClick));
    list.removeEventListener('click', onListClick);
    document.removeEventListener('click', onDocumentClick);
    window.removeEventListener('keydown', onWindowKeydown);
    close();
  };
}
