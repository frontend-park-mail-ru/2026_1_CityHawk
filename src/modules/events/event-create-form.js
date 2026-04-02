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
  const titleInput = root.querySelector('[data-role="event-create-title"]');
  const titleError = root.querySelector('[data-role="event-create-title-error"]');
  const dateInput = root.querySelector('[data-role="event-create-date"]');
  const dateError = root.querySelector('[data-role="event-create-date-error"]');
  const placeInput = root.querySelector('[data-role="event-create-place"]');
  const placeError = root.querySelector('[data-role="event-create-place-error"]');
  const categoryInput = root.querySelector('[data-role="event-create-category"]');
  const categoryError = root.querySelector('[data-role="event-create-category-error"]');
  const descriptionInput = root.querySelector('[data-role="event-create-description"]');
  const descriptionError = root.querySelector('[data-role="event-create-description-error"]');
  const locationDescriptionInput = root.querySelector('[data-role="event-create-location-description"]');
  const locationDescriptionError = root.querySelector('[data-role="event-create-location-description-error"]');

  const showFieldError = (input, errorNode, message) => {
    if (input instanceof HTMLElement) {
      input.classList.add('event-create-form__input--error');
      input.setAttribute('aria-invalid', 'true');
    }

    if (errorNode instanceof HTMLElement) {
      errorNode.textContent = message;
      errorNode.hidden = false;
    }
  };

  const clearFieldError = (input, errorNode) => {
    if (input instanceof HTMLElement) {
      input.classList.remove('event-create-form__input--error');
      input.removeAttribute('aria-invalid');
    }

    if (errorNode instanceof HTMLElement) {
      errorNode.textContent = '';
      errorNode.hidden = true;
    }
  };

  const handleSubmit = (event) => {
    event.preventDefault();

    if (!(form instanceof HTMLFormElement)) {
      return;
    }

    const formData = new FormData(form);
    const title = String(formData.get('title') || '').trim();
    const date = String(formData.get('date') || '').trim();
    const place = String(formData.get('place') || '').trim();
    const category = String(formData.get('category') || '').trim();
    const tags = String(formData.get('tags') || '')
      .split(',')
      .map((tag) => tag.trim())
      .filter(Boolean);
    const description = String(formData.get('description') || '').trim();
    const locationDescription = String(formData.get('locationDescription') || '').trim();

    if (!title) {
      showFieldError(titleInput, titleError, 'Укажи название события');
      titleInput?.focus();
      return;
    }

    clearFieldError(titleInput, titleError);

    if (!date) {
      showFieldError(dateInput, dateError, 'Укажи дату события');
      dateInput?.focus();
      return;
    }

    clearFieldError(dateInput, dateError);

    if (!place) {
      showFieldError(placeInput, placeError, 'Укажи место события');
      placeInput?.focus();
      return;
    }

    clearFieldError(placeInput, placeError);

    if (!category) {
      showFieldError(categoryInput, categoryError, 'Выбери категорию');
      categoryInput?.focus();
      return;
    }

    clearFieldError(categoryInput, categoryError);

    if (!description) {
      showFieldError(descriptionInput, descriptionError, 'Добавь описание события');
      descriptionInput?.focus();
      return;
    }

    clearFieldError(descriptionInput, descriptionError);

    if (!locationDescription) {
      showFieldError(
        locationDescriptionInput,
        locationDescriptionError,
        'Добавь описание местоположения',
      );
      locationDescriptionInput?.focus();
      return;
    }

    clearFieldError(locationDescriptionInput, locationDescriptionError);

    const payload = {
      title,
      date,
      place,
      category,
      tags,
      description,
      locationDescription,
    };

    if (typeof options.onSubmit === 'function') {
      options.onSubmit(payload, form, event);
    }
  };

  const handleTitleInput = () => {
    if (!(titleInput instanceof HTMLInputElement)) {
      return;
    }

    if (titleInput.value.trim()) {
      clearFieldError(titleInput, titleError);
    }
  };

  const handleDateChange = () => {
    if (!(dateInput instanceof HTMLInputElement)) {
      return;
    }

    if (dateInput.value.trim()) {
      clearFieldError(dateInput, dateError);
    }
  };

  const handlePlaceInput = () => {
    if (!(placeInput instanceof HTMLInputElement)) {
      return;
    }

    if (placeInput.value.trim()) {
      clearFieldError(placeInput, placeError);
    }
  };

  const handleCategoryChange = () => {
    if (!(categoryInput instanceof HTMLSelectElement)) {
      return;
    }

    if (categoryInput.value.trim()) {
      clearFieldError(categoryInput, categoryError);
    }
  };

  const handleDescriptionInput = () => {
    if (!(descriptionInput instanceof HTMLTextAreaElement)) {
      return;
    }

    if (descriptionInput.value.trim()) {
      clearFieldError(descriptionInput, descriptionError);
    }
  };

  const handleLocationDescriptionInput = () => {
    if (!(locationDescriptionInput instanceof HTMLTextAreaElement)) {
      return;
    }

    if (locationDescriptionInput.value.trim()) {
      clearFieldError(locationDescriptionInput, locationDescriptionError);
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

  if (titleInput instanceof HTMLInputElement) {
    titleInput.addEventListener('input', handleTitleInput);
  }

  if (dateInput instanceof HTMLInputElement) {
    dateInput.addEventListener('change', handleDateChange);
  }

  if (placeInput instanceof HTMLInputElement) {
    placeInput.addEventListener('input', handlePlaceInput);
  }

  if (categoryInput instanceof HTMLSelectElement) {
    categoryInput.addEventListener('change', handleCategoryChange);
  }

  if (descriptionInput instanceof HTMLTextAreaElement) {
    descriptionInput.addEventListener('input', handleDescriptionInput);
  }

  if (locationDescriptionInput instanceof HTMLTextAreaElement) {
    locationDescriptionInput.addEventListener('input', handleLocationDescriptionInput);
  }

  if (cancelButton instanceof HTMLButtonElement) {
    cancelButton.addEventListener('click', handleCancel);
  }

  return () => {
    if (form instanceof HTMLFormElement) {
      form.removeEventListener('submit', handleSubmit);
    }

    if (titleInput instanceof HTMLInputElement) {
      titleInput.removeEventListener('input', handleTitleInput);
    }

    if (dateInput instanceof HTMLInputElement) {
      dateInput.removeEventListener('change', handleDateChange);
    }

    if (placeInput instanceof HTMLInputElement) {
      placeInput.removeEventListener('input', handlePlaceInput);
    }

    if (categoryInput instanceof HTMLSelectElement) {
      categoryInput.removeEventListener('change', handleCategoryChange);
    }

    if (descriptionInput instanceof HTMLTextAreaElement) {
      descriptionInput.removeEventListener('input', handleDescriptionInput);
    }

    if (locationDescriptionInput instanceof HTMLTextAreaElement) {
      locationDescriptionInput.removeEventListener('input', handleLocationDescriptionInput);
    }

    if (cancelButton instanceof HTMLButtonElement) {
      cancelButton.removeEventListener('click', handleCancel);
    }
  };
}
