import { renderTemplate } from '../../app/templates/renderer.js';

const DEFAULT_CATEGORIES = [
  { value: 'concert', label: 'Концерт' },
  { value: 'exhibition', label: 'Выставка' },
  { value: 'show', label: 'Шоу' },
  { value: 'theater', label: 'Театр' },
];

const DEFAULT_PLACES = [
  { value: 'vdnh', label: 'ВДНХ' },
  { value: 'live-arena', label: 'Live Арена' },
  { value: 'navka-arena', label: 'Навка Арена' },
  { value: 'bolshoi', label: 'Большой театр' },
];

/**
 * Рендерит форму создания события.
 *
 * @param {{
 *   categories?: Array<{ value: string, label: string }>,
 *   places?: Array<{ value: string, label: string }>
 * }} [state]
 * @returns {string}
 */
export function renderEventCreateForm(state = {}) {
  const categories = Array.isArray(state.categories) && state.categories.length
    ? state.categories
    : DEFAULT_CATEGORIES;
  const places = Array.isArray(state.places) && state.places.length
    ? state.places
    : DEFAULT_PLACES;

  return renderTemplate('event-create-form', { categories, places });
}

function showFieldError(input, errorNode, message) {
  if (input instanceof HTMLElement) {
    input.classList.add('event-create-form__input--error');
    input.setAttribute('aria-invalid', 'true');
  }

  if (errorNode instanceof HTMLElement) {
    errorNode.textContent = message;
    errorNode.hidden = false;
  }
}

function clearFieldError(input, errorNode) {
  if (input instanceof HTMLElement) {
    input.classList.remove('event-create-form__input--error');
    input.removeAttribute('aria-invalid');
  }

  if (errorNode instanceof HTMLElement) {
    errorNode.textContent = '';
    errorNode.hidden = true;
  }
}

function collectFormValues(form) {
  const formData = new FormData(form);

  return {
    title: String(formData.get('title') || '').trim(),
    date: String(formData.get('date') || '').trim(),
    placeId: String(formData.get('placeId') || '').trim(),
    category: String(formData.get('category') || '').trim(),
    tags: String(formData.get('tags') || '')
      .split(',')
      .map((tag) => tag.trim())
      .filter(Boolean),
    description: String(formData.get('description') || '').trim(),
    locationDescription: String(formData.get('locationDescription') || '').trim(),
  };
}

function validateRequiredField(value, input, errorNode, message) {
  if (!value) {
    showFieldError(input, errorNode, message);
    input?.focus();
    return false;
  }

  clearFieldError(input, errorNode);
  return true;
}

function createInputClearHandler(input, errorNode) {
  return () => {
    if (!(input instanceof HTMLInputElement
      || input instanceof HTMLTextAreaElement
      || input instanceof HTMLSelectElement)) {
      return;
    }

    if (input.value.trim()) {
      clearFieldError(input, errorNode);
    }
  };
}

function createImageFieldController({ trigger, input, removeButton }) {
  let file = null;
  let previewUrl = '';

  const applyPreview = (nextPreviewUrl) => {
    if (trigger instanceof HTMLElement) {
      trigger.style.backgroundImage = nextPreviewUrl ? `url("${nextPreviewUrl}")` : '';
      trigger.style.backgroundSize = nextPreviewUrl ? 'cover' : '';
      trigger.style.backgroundPosition = nextPreviewUrl ? 'center' : '';
      trigger.classList.toggle('event-create-upload--has-image', Boolean(nextPreviewUrl));
    }

    if (removeButton instanceof HTMLButtonElement) {
      removeButton.hidden = !nextPreviewUrl;
    }
  };

  const clear = () => {
    file = null;

    if (input instanceof HTMLInputElement) {
      input.value = '';
    }

    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      previewUrl = '';
    }

    applyPreview('');
  };

  const handleTriggerClick = () => {
    if (input instanceof HTMLInputElement) {
      input.click();
    }
  };

  const handleInputChange = () => {
    if (!(input instanceof HTMLInputElement)) {
      return;
    }

    const nextFile = input.files?.[0];
    if (!nextFile) {
      return;
    }

    file = nextFile;

    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }

    previewUrl = URL.createObjectURL(nextFile);
    applyPreview(previewUrl);
  };

  const handleRemoveClick = (event) => {
    event.preventDefault();
    event.stopPropagation();
    clear();
  };

  const bind = () => {
    trigger?.addEventListener('click', handleTriggerClick);
    input?.addEventListener('change', handleInputChange);
    removeButton?.addEventListener('click', handleRemoveClick);
  };

  const unbind = () => {
    trigger?.removeEventListener('click', handleTriggerClick);
    input?.removeEventListener('change', handleInputChange);
    removeButton?.removeEventListener('click', handleRemoveClick);

    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
  };

  return {
    bind,
    unbind,
    clear,
    getFile: () => file,
  };
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
  const posterTrigger = root.querySelector('[data-role="event-create-poster-trigger"]');
  const posterInput = root.querySelector('[data-role="event-create-poster-input"]');
  const posterRemoveButton = root.querySelector('[data-role="event-create-poster-remove"]');
  const galleryTriggers = Array.from(root.querySelectorAll('[data-role="event-create-gallery-trigger"]'));
  const galleryInputs = Array.from(root.querySelectorAll('[data-role="event-create-gallery-input"]'));
  const galleryRemoveButtons = Array.from(root.querySelectorAll('[data-role="event-create-gallery-remove"]'));
  const posterController = createImageFieldController({
    trigger: posterTrigger,
    input: posterInput,
    removeButton: posterRemoveButton,
  });
  const galleryControllers = galleryTriggers.map((trigger, index) => createImageFieldController({
    trigger,
    input: galleryInputs[index],
    removeButton: galleryRemoveButtons[index],
  }));
  const handleTitleInput = createInputClearHandler(titleInput, titleError);
  const handleDateChange = createInputClearHandler(dateInput, dateError);
  const handlePlaceInput = createInputClearHandler(placeInput, placeError);
  const handleCategoryChange = createInputClearHandler(categoryInput, categoryError);
  const handleDescriptionInput = createInputClearHandler(descriptionInput, descriptionError);
  const handleLocationDescriptionInput = createInputClearHandler(
    locationDescriptionInput,
    locationDescriptionError,
  );

  const handleSubmit = (event) => {
    event.preventDefault();

    if (!(form instanceof HTMLFormElement)) {
      return;
    }

    const values = collectFormValues(form);

    if (!validateRequiredField(values.title, titleInput, titleError, 'Укажи название события')) {
      return;
    }

    if (!validateRequiredField(values.date, dateInput, dateError, 'Укажи дату события')) {
      return;
    }

    if (!validateRequiredField(values.placeId, placeInput, placeError, 'Укажи место события')) {
      return;
    }

    if (!validateRequiredField(values.category, categoryInput, categoryError, 'Выбери категорию')) {
      return;
    }

    if (!validateRequiredField(
      values.description,
      descriptionInput,
      descriptionError,
      'Добавь описание события',
    )) {
      return;
    }

    if (!validateRequiredField(
      values.locationDescription,
      locationDescriptionInput,
      locationDescriptionError,
      'Добавь описание местоположения',
    )) {
      return;
    }

    const payload = {
      ...values,
      posterFile: posterController.getFile(),
      galleryFiles: galleryControllers
        .map((controller) => controller.getFile())
        .filter(Boolean),
    };

    if (typeof options.onSubmit === 'function') {
      options.onSubmit(payload, form, event);
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

  if (placeInput instanceof HTMLSelectElement) {
    placeInput.addEventListener('change', handlePlaceInput);
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
  posterController.bind();
  galleryControllers.forEach((controller) => controller.bind());

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

    if (placeInput instanceof HTMLSelectElement) {
      placeInput.removeEventListener('change', handlePlaceInput);
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

    posterController.unbind();
    galleryControllers.forEach((controller) => controller.unbind());
  };
}
