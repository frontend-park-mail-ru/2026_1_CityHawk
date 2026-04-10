import { deleteEvent, getEventById } from '../../api/events.api.js';
import { getMeOrNull } from '../../api/profile.api.js';
import { getHeaderUserDisplayName } from '../../components/header/header-user.js';
import { renderEventDeleteCard } from '../../modules/events/event-delete-card.js';
import {
  attachEventDeleteScreen,
  renderEventDeleteScreen,
} from '../../modules/events/event-delete-screen.js';
import { renderTemplate } from '../../app/templates/renderer.js';

/** @typedef {import('../../types/router.js').RouteContext} RouteContext */
/** @typedef {import('../../types/router.js').RouteView} RouteView */
/** @typedef {import('../../types/api.js').ApiError} ApiError */

function getEventActionErrorMessage(error, actionLabel) {
  const status = /** @type {ApiError | undefined} */ (error)?.status;

  if (status === 401) {
    return 'Нужно войти в аккаунт, чтобы управлять событием';
  }

  if (status === 403) {
    return `Только автор события может ${actionLabel}`;
  }

  if (status === 404) {
    return 'Событие не найдено';
  }

  return `Не удалось ${actionLabel}`;
}

/**
 * Страница подтверждения удаления события.
 *
 * @param {RouteContext} options
 * @returns {Promise<RouteView>}
 */
export async function eventDeletePage({ navigate, params }) {
  const headerQuery = new URLSearchParams(window.location.search).get('query') || '';
  const eventId = String(params?.eventId || '').trim();
  let user = null;
  let event = null;

  const me = await getMeOrNull();
  user = me
    ? {
      ...me,
      displayName: getHeaderUserDisplayName(me),
    }
    : null;

  try {
    event = await getEventById(eventId);
  } catch {
    return {
      html: renderTemplate('app-error'),
    };
  }

  const eventDeleteCard = renderEventDeleteCard({
    eventId,
    eventTitle: event?.title || 'это событие',
  });

  const html = renderEventDeleteScreen({
    eventDeleteCard,
    user,
    headerSearch: { query: headerQuery },
  });

  return {
    html,
    mount(root) {
      return attachEventDeleteScreen(root, {
        navigate,
        async onConfirm() {
          try {
            await deleteEvent(eventId);
            navigate('/events');
          } catch (error) {
            window.alert(getEventActionErrorMessage(error, 'удалить событие'));
          }
        },
      });
    },
  };
}
