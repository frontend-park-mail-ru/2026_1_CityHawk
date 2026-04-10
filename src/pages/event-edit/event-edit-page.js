import { getEventById, updateEvent } from '../../api/events.api.js';
import { getMeOrNull } from '../../api/profile.api.js';
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
/** @typedef {import('../../types/api.js').ApiError} ApiError */

/** @typedef {import('../../types/router.js').RouteContext} RouteContext */
/** @typedef {import('../../types/router.js').RouteView} RouteView */

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
 * Страница редактирования события.
 *
 * @param {RouteContext} options
 * @returns {Promise<RouteView>}
 */
export async function eventEditPage({ navigate, params }) {
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

  const { places, categories } = await loadEventFormReferenceData();

  const eventForm = renderEventForm({
    mode: 'edit',
    submitLabel: 'Сохранить изменения',
    deleteHref: `/events/${eventId}/delete`,
    places,
    categories,
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
            await updateEvent(eventId, payload);
            navigate(`/events/${eventId}`);
          } catch (error) {
            window.alert(getEventActionErrorMessage(error, 'сохранить изменения'));
          }
        },
        onCancel() {
          navigate(`/events/${eventId}`);
        },
      });
    },
  };
}
