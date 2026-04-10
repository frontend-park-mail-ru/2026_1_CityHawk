import { renderTemplate } from '../../app/templates/renderer.js';

const DEFAULT_CATEGORIES = [
  { value: 'concert', label: 'Концерт' },
  { value: 'exhibition', label: 'Выставка' },
  { value: 'show', label: 'Шоу' },
  { value: 'theater', label: 'Театр' },
];

/**
 * Рендерит форму создания события.
 *
 * @param {{ categories?: Array<{ value: string, label: string }> }} [state]
 * @returns {string}
 */
export function renderEventCreateForm(state = {}) {
  const categories = Array.isArray(state.categories) && state.categories.length
    ? state.categories
    : DEFAULT_CATEGORIES;

  return renderTemplate('event-create-form', { categories });
}

/**
 * Подключает submit/cancel-обработчики формы создания события.
 *
 * @param {ParentNode} root
 * @param {{ onSubmit?: (event: SubmitEvent, form: HTMLFormElement) => void, onCancel?: () => void }} [options]
 * @returns {() => void}
 */
export function attachEventCreateForm(root, options = {}) {
  const form = root.querySelector('[data-role="event-create-form"]');
  const cancelButton = root.querySelector('[data-action="event-create-cancel"]');

  const handleSubmit = (event) => {
    event.preventDefault();

    if (form instanceof HTMLFormElement && typeof options.onSubmit === 'function') {
      options.onSubmit(event, form);
    }
  };

  const handleCancel = () => {
    if (typeof options.onCancel === 'function') {
      options.onCancel();
    }
  };

  if (form instanceof HTMLFormElement) {
    form.addEventListener('submit', handleSubmit);
  }

  if (cancelButton instanceof HTMLButtonElement) {
    cancelButton.addEventListener('click', handleCancel);
  }

  return () => {
    if (form instanceof HTMLFormElement) {
      form.removeEventListener('submit', handleSubmit);
    }

    if (cancelButton instanceof HTMLButtonElement) {
      cancelButton.removeEventListener('click', handleCancel);
    }
  };
}
