import { createEvent } from '../../api/events.api.js';
import { getMeOrNull } from '../../api/profile.api.js';
import { getHeaderUserDisplayName } from '../../components/header/header-user.js';
import { renderEventForm } from '../../modules/events/event-form.js';
import {
  attachEventEditorScreen,
  renderEventEditorScreen,
} from '../../modules/events/event-editor-screen.js';
import { mapEventFormPayloadToEventPayload } from '../../modules/events/event-form-payload.js';
import { loadEventFormReferenceData } from '../../modules/events/event-form-reference-data.js';

/** @typedef {import('../../types/router.js').RouteContext} RouteContext */
/** @typedef {import('../../types/router.js').RouteView} RouteView */

/**
 * Страница создания события.
 *
 * @param {RouteContext} options
 * @returns {Promise<RouteView>}
 */
export async function eventCreatePage({ navigate }) {
  const headerQuery = new URLSearchParams(window.location.search).get('query') || '';
  let user = null;
  const me = await getMeOrNull();
  user = me
    ? {
      ...me,
      displayName: getHeaderUserDisplayName(me),
    }
    : null;

  const { places, categories } = await loadEventFormReferenceData();

  const eventForm = renderEventForm({
    mode: 'create',
    places,
    categories,
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
            const createdEvent = await createEvent(payload);
            const nextEventId = createdEvent?.id;

            if (nextEventId) {
              navigate(`/events/${nextEventId}`);
              return;
            }

            navigate('/events');
          } catch (error) {
            window.alert(error?.message || 'Не удалось опубликовать событие');
          }
        },
        onCancel() {
          navigate('/events');
        },
      });
    },
  };
}
