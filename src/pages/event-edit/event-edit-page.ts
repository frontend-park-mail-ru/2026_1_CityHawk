import { getEventById, updateEventMultipart } from '../../api/events.api.js';
import { getMeOrNull } from '../../api/profile.api.js';
import '../../modules/events/event-editor-screen.css';
import '../../modules/events/event-form.css';
import { getHeaderUserDisplayName } from '../../components/header/header-user.js';
import { renderEventForm } from '../../modules/events/event-form.js';
import {
  attachEventEditorScreen,
  renderEventEditorScreen,
} from '../../modules/events/event-editor-screen.js';
import {
  mapEventDetailsToInitialValues,
  mapEventFormPayloadToEventPayload,
} from '../../modules/events/event-form-payload.js';
import { loadEventFormReferenceData } from '../../modules/events/event-form-reference-data.js';
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
 * Страница редактирования события.
 *
 */
export async function eventEditPage({ navigate, params }: RouteContext): Promise<RouteView> {
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

  const { places, categories, tags } = await loadEventFormReferenceData();

  const eventForm = renderEventForm({
    mode: 'edit',
    submitLabel: 'Сохранить изменения',
    deleteHref: `/events/${eventId}/delete`,
    places,
    categories,
    tags,
    initialValues: mapEventDetailsToInitialValues(event),
  });

  const html = renderEventEditorScreen({
    eyebrow: 'Редактирование',
    title: 'Обнови событие и сохрани изменения',
    eventForm,
    user,
    headerSearch: { query: headerQuery },
  });

  return {
    html,
    mount(root) {
      return attachEventEditorScreen(root, {
        navigate,
        async onSubmit(formPayload) {
          try {
            const payload = mapEventFormPayloadToEventPayload(formPayload);
            await updateEventMultipart(eventId, payload, formPayload.imageFiles);
            navigate(`/events/${eventId}`);
          } catch (error) {
            const apiError = error instanceof Error ? (error as ApiError) : undefined;
            window.alert(getEventActionErrorMessage(apiError, 'сохранить изменения'));
          }
        },
        onCancel() {
          navigate(`/events/${eventId}`);
        },
      });
    },
  };
}
