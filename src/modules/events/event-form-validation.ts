import type { EventFormValues } from './event-form-payload.js';
import type { EventFormElements } from './event-form-selectors.js';

interface EventFormScheduleValidator {
  validate: (values: EventFormValues) => boolean;
}

export type FormFieldElement = HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement;

export interface EventFormValidator {
  bind: () => void;
  unbind: () => void;
  validate: (values: EventFormValues) => boolean;
}

interface EventFormValidatorOptions {
  elements: EventFormElements;
  scheduleController: EventFormScheduleValidator;
}

export function showFieldError(input: Element | null, errorNode: Element | null, message: string): void {
  if (input instanceof HTMLElement) {
    input.classList.add('event-create-form__input--error');
    input.setAttribute('aria-invalid', 'true');
  }

  if (errorNode instanceof HTMLElement) {
    errorNode.textContent = message;
    errorNode.hidden = false;
  }
}

export function clearFieldError(input: Element | null, errorNode: Element | null): void {
  if (input instanceof HTMLElement) {
    input.classList.remove('event-create-form__input--error');
    input.removeAttribute('aria-invalid');
  }

  if (errorNode instanceof HTMLElement) {
    errorNode.textContent = '';
    errorNode.hidden = true;
  }
}

export function validateRequiredField(
  value: string,
  input: FormFieldElement | null,
  errorNode: Element | null,
  message: string,
): boolean {
  if (!value) {
    showFieldError(input, errorNode, message);
    input?.focus();
    return false;
  }

  clearFieldError(input, errorNode);
  return true;
}

export function createInputClearHandler(input: Element | null, errorNode: Element | null): () => void {
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

export function createEventFormValidator({
  elements,
  scheduleController,
}: EventFormValidatorOptions): EventFormValidator {
  const handleTitleInput = createInputClearHandler(elements.titleInput, elements.titleError);
  const handlePlaceInput = createInputClearHandler(elements.placeInput, elements.placeError);
  const handleCategoryChange = createInputClearHandler(elements.categoryInput, elements.categoryError);
  const handleDescriptionInput = createInputClearHandler(elements.descriptionInput, elements.descriptionError);
  const handleLocationDescriptionInput = createInputClearHandler(
    elements.locationDescriptionInput,
    elements.locationDescriptionError,
  );

  const validate = (values: EventFormValues): boolean => {
    if (!validateRequiredField(values.title, elements.titleInput, elements.titleError, 'Укажи название события')) {
      return false;
    }

    if (!scheduleController.validate(values)) {
      return false;
    }

    if (!validateRequiredField(values.placeId, elements.placeInput, elements.placeError, 'Укажи место события')) {
      return false;
    }

    if (!validateRequiredField(values.category, elements.categoryInput, elements.categoryError, 'Выбери категорию')) {
      return false;
    }

    if (!validateRequiredField(
      values.description,
      elements.descriptionInput,
      elements.descriptionError,
      'Добавь описание события',
    )) {
      return false;
    }

    if (!validateRequiredField(
      values.locationDescription,
      elements.locationDescriptionInput,
      elements.locationDescriptionError,
      'Добавь описание местоположения',
    )) {
      return false;
    }

    return true;
  };

  return {
    bind: () => {
      elements.titleInput?.addEventListener('input', handleTitleInput);
      elements.placeInput?.addEventListener('change', handlePlaceInput);
      elements.categoryInput?.addEventListener('change', handleCategoryChange);
      elements.descriptionInput?.addEventListener('input', handleDescriptionInput);
      elements.locationDescriptionInput?.addEventListener('input', handleLocationDescriptionInput);
    },
    unbind: () => {
      elements.titleInput?.removeEventListener('input', handleTitleInput);
      elements.placeInput?.removeEventListener('change', handlePlaceInput);
      elements.categoryInput?.removeEventListener('change', handleCategoryChange);
      elements.descriptionInput?.removeEventListener('input', handleDescriptionInput);
      elements.locationDescriptionInput?.removeEventListener('input', handleLocationDescriptionInput);
    },
    validate,
  };
}
