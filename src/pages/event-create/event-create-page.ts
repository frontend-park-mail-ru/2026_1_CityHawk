import { createEventMultipart } from '../../api/events.api.js';
import { getMeOrNull } from '../../api/profile.api.js';
import '../../modules/events/form/event-editor-screen.css';
import '../../modules/events/form/event-form.css';
import { getHeaderUserDisplayName } from '../../components/header/header-user.js';
import { showToast } from '../../app/ui/toast.js';
import { renderEventForm } from '../../modules/events/form/event-form.js';
import {
  attachEventEditorScreen,
  renderEventEditorScreen,
} from '../../modules/events/form/event-editor-screen.js';
import { mapEventFormPayloadToEventPayload } from '../../modules/events/form/event-form-payload.js';
import { loadEventFormReferenceData } from '../../modules/events/form/event-form-reference-data.js';
import type { ApiError, User } from '../../types/api.js';
import type { RouteContext, RouteView } from '../../types/router.js';

type HeaderUser = User & { displayName: string };

function getEventCreateErrorMessage(error: unknown): string {
  const apiError = error as ApiError | undefined;
  const details = apiError?.details || {};
  const detail = Object.values(details).find((value) => typeof value === 'string' && value);
  const message = error instanceof Error ? error.message : '';
  const source = detail || message;

  if (/too large|file is too large/i.test(source)) {
    return 'Загрузите изображения до 5 МБ';
  }

  if (/image/i.test(source)) {
    return 'Загрузите PNG, JPEG, GIF или WebP';
  }

  return message || 'Не удалось опубликовать событие';
}

/**
 * Страница создания события.
 *
 */
export async function eventCreatePage({ navigate }: RouteContext): Promise<RouteView> {
  const headerQuery = new URLSearchParams(window.location.search).get('query') || '';
  let user: HeaderUser | null = null;
  const me = await getMeOrNull();
  user = me
    ? {
      ...me,
      displayName: getHeaderUserDisplayName(me),
    }
    : null;

  const { places, categories, tags } = await loadEventFormReferenceData();

  const eventForm = renderEventForm({
    mode: 'create',
    places,
    categories,
    tags,
  });

  const html = renderEventEditorScreen({
    eyebrow: 'Новое событие',
    title: 'Создай свое мероприятие!',
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
            const createdEvent = await createEventMultipart(payload, formPayload.imageFiles);
            const nextEventId = createdEvent?.id;

            if (nextEventId) {
              navigate(`/events/${nextEventId}`);
              return;
            }

            navigate('/events');
          } catch (error) {
            showToast(getEventCreateErrorMessage(error), { type: 'error' });
          }
        },
        onCancel() {
          navigate('/events');
        },
      });
    },
  };
}
