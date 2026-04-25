import { createEventMultipart } from '../../api/events.api.js';
import { getMeOrNull } from '../../api/profile.api.js';
import '../../modules/events/event-editor-screen.css';
import '../../modules/events/event-form.css';
import { getHeaderUserDisplayName } from '../../components/header/header-user.js';
import { renderEventForm } from '../../modules/events/event-form.js';
import {
  attachEventEditorScreen,
  renderEventEditorScreen,
} from '../../modules/events/event-editor-screen.js';
import { mapEventFormPayloadToEventPayload } from '../../modules/events/event-form-payload.js';
import { loadEventFormReferenceData } from '../../modules/events/event-form-reference-data.js';
import type { User } from '../../types/api.js';
import type { RouteContext, RouteView } from '../../types/router.js';

type HeaderUser = User & { displayName: string };

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
            const message = error instanceof Error ? error.message : 'Не удалось опубликовать событие';
            window.alert(message);
          }
        },
        onCancel() {
          navigate('/events');
        },
      });
    },
  };
}
