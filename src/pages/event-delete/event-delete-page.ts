import { deleteEvent, getEventById } from '../../api/events.api.js';
import { getMeOrNull } from '../../api/profile.api.js';
import '../../modules/events/event-delete-card.css';
import '../../modules/events/event-delete-screen.css';
import { getHeaderUserDisplayName } from '../../components/header/header-user.js';
import { renderEventDeleteCard } from '../../modules/events/event-delete-card.js';
import {
  attachEventDeleteScreen,
  renderEventDeleteScreen,
} from '../../modules/events/event-delete-screen.js';
import { renderTemplate } from '../../app/templates/renderer.js';
import type { ApiError, User } from '../../types/api.js';
import type { RouteContext, RouteView } from '../../types/router.js';

type HeaderUser = User & { displayName: string };

function getEventActionErrorMessage(error: ApiError | Error | null | undefined, actionLabel: string): string {
  const status = (error as ApiError | undefined)?.status;

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
 */
export async function eventDeletePage({ navigate, params }: RouteContext): Promise<RouteView> {
  const headerQuery = new URLSearchParams(window.location.search).get('query') || '';
  const eventId = String(params?.eventId || '').trim();
  let user: HeaderUser | null = null;
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
            const apiError = error instanceof Error ? (error as ApiError) : undefined;
            window.alert(getEventActionErrorMessage(apiError, 'удалить событие'));
          }
        },
      });
    },
  };
}
