import { updateInvitationStatus } from '../../api/invitations.api.js';
import { getMyNotifications, markNotificationRead } from '../../api/notifications.api.js';
import type { NotificationItem } from '../../types/api.js';

type NotificationFilter = 'all' | 'invitations' | 'system';

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
    createTextElement('h3', 'site-header__notification-title', item.title || 'Уведомление'),
    createTextElement('time', 'site-header__notification-time', formatNotificationTime(item.createdAt)),
  );
  body.append(topLine);

  if (item.message) {
    body.append(createTextElement('p', 'site-header__notification-text', item.message));
  }

  if (item.event?.title) {
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
  const list = root.querySelector<HTMLElement>('[data-role="header-notifications-list"]');
  const count = root.querySelector<HTMLElement>('[data-role="header-notifications-count"]');
  const tabs = Array.from(root.querySelectorAll<HTMLButtonElement>('[data-role="header-notifications-tab"]'));

  if (!(host instanceof HTMLElement) || !(list instanceof HTMLElement)) {
    return () => {};
  }

  let disposed = false;
  let activeType: NotificationFilter = 'all';

  const load = async () => {
    list.innerHTML = '';
    list.append(createTextElement('p', 'site-header__notifications-empty', 'Загрузка уведомлений...'));

    try {
      const response = await getMyNotifications({ type: activeType, limit: 20 });
      if (disposed) {
        return;
      }

      list.innerHTML = '';
      const items = Array.isArray(response.items) ? response.items : [];
      if (items.length === 0) {
        list.append(createTextElement('p', 'site-header__notifications-empty', 'Уведомлений пока нет'));
      } else {
        items.forEach((item) => list.append(renderNotification(item)));
      }

      if (count instanceof HTMLElement) {
        count.textContent = String(response.unreadCount || 0);
        count.hidden = !response.unreadCount;
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

    const nextType = String(button.dataset.notificationType || 'all') as NotificationFilter;
    activeType = nextType;
    tabs.forEach((tab) => {
      tab.classList.toggle('site-header__notifications-tab--active', tab === button);
    });
    void load();
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
      if (!invitationId) {
        return;
      }

      invitationButton.disabled = true;
      try {
        await updateInvitationStatus(invitationId, status);
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

  tabs.forEach((tab) => tab.addEventListener('click', onTabClick));
  list.addEventListener('click', onListClick);
  void load();

  return () => {
    disposed = true;
    tabs.forEach((tab) => tab.removeEventListener('click', onTabClick));
    list.removeEventListener('click', onListClick);
  };
}
