import { renderTemplate } from '../../app/templates/renderer.js';
import type {
  EventFormInitialValues,
  EventFormScheduleMode,
  EventFormValues,
} from './event-form-payload.js';
import type { EventFormSelectOption } from './event-form-reference-data.js';

const GALLERY_PREVIEW_SLOTS = 4;

export interface EventFormMultipleRow {
  date: string;
  startTime: string;
  endTime: string;
}

interface NormalizedEventFormInitialValues {
  title: string;
  scheduleMode: EventFormScheduleMode;
  isSingleSchedule: boolean;
  isMultipleSchedule: boolean;
  isPeriodSchedule: boolean;
  singleDate: string;
  singleStartTime: string;
  singleEndTime: string;
  multipleRows: EventFormMultipleRow[];
  periodStart: string;
  periodEnd: string;
  isAnytime: boolean;
  placeId: string;
  category: string;
  tags: string;
  description: string;
  locationDescription: string;
  posterPreviewUrl: string;
  galleryPreviewUrls: string[];
}

export interface EventFormSubmitPayload extends EventFormValues {
  posterFile: File | null;
  galleryFiles: File[];
}

export interface EventFormRenderState {
  mode?: 'create' | 'edit';
  submitLabel?: string;
  categories?: EventFormSelectOption[];
  places?: EventFormSelectOption[];
  initialValues?: EventFormInitialValues;
  deleteHref?: string;
}

export interface EventFormOptions {
  onSubmit?: (
    payload: EventFormSubmitPayload,
    form: HTMLFormElement,
    event: SubmitEvent,
  ) => void;
  onCancel?: () => void;
}

interface ImageFieldControllerOptions {
  trigger: Element | null;
  input: Element | null;
  removeButton: Element | null;
  initialPreviewUrl?: string;
}

interface ImageFieldController {
  bind: () => void;
  unbind: () => void;
  clear: () => void;
  getFile: () => File | null;
}

type FormFieldElement = HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement;

function buildSelectOptions(items: EventFormSelectOption[], selectedValue: string): EventFormSelectOption[] {
  return items.map((item) => ({
    ...item,
    selected: item.value === selectedValue,
  }));
}

function normalizeTags(tags?: string[] | string): string {
  if (Array.isArray(tags)) {
    return tags
      .map((tag) => String(tag || '').trim())
      .filter(Boolean)
      .join(', ');
  }

  return String(tags || '').trim();
}

function buildMultipleRows(initialValues: EventFormInitialValues = {}): EventFormMultipleRow[] {
  const multipleDates = Array.isArray(initialValues.multipleDates)
    ? initialValues.multipleDates.map((value) => String(value || '').trim())
    : [];
  const multipleStartTimes = Array.isArray(initialValues.multipleStartTimes)
    ? initialValues.multipleStartTimes.map((value) => String(value || '').trim())
    : [];
  const multipleEndTimes = Array.isArray(initialValues.multipleEndTimes)
    ? initialValues.multipleEndTimes.map((value) => String(value || '').trim())
    : [];

  const rowsCount = Math.max(
    multipleDates.length,
    multipleStartTimes.length,
    multipleEndTimes.length,
    1,
  );

  return Array.from({ length: rowsCount }, (_, index) => ({
    date: multipleDates[index] || '',
    startTime: multipleStartTimes[index] || '',
    endTime: multipleEndTimes[index] || '',
  }));
}

function normalizePreviewUrls(
  values: EventFormInitialValues,
  fallbackKey: 'galleryUrls',
): string[] {
  const previews = Array.isArray(values.galleryPreviewUrls)
    ? values.galleryPreviewUrls
    : Array.isArray(values[fallbackKey])
      ? values[fallbackKey]
      : [];

  return Array.from({ length: GALLERY_PREVIEW_SLOTS }, (_, index) => String(previews[index] || '').trim());
}

function isScheduleMode(value: string | null | undefined): value is EventFormScheduleMode {
  return value === 'single' || value === 'multiple' || value === 'period';
}

function normalizeInitialValues(
  initialValues: EventFormInitialValues = {},
): NormalizedEventFormInitialValues {
  const scheduleMode = isScheduleMode(initialValues.scheduleMode)
    ? initialValues.scheduleMode
    : 'single';

  return {
    title: String(initialValues.title || '').trim(),
    scheduleMode,
    isSingleSchedule: scheduleMode === 'single',
    isMultipleSchedule: scheduleMode === 'multiple',
    isPeriodSchedule: scheduleMode === 'period',
    singleDate: String(initialValues.singleDate || '').trim(),
    singleStartTime: String(initialValues.singleStartTime || '').trim(),
    singleEndTime: String(initialValues.singleEndTime || '').trim(),
    multipleRows: buildMultipleRows(initialValues),
    periodStart: String(initialValues.periodStart || '').trim(),
    periodEnd: String(initialValues.periodEnd || '').trim(),
    isAnytime: Boolean(initialValues.isAnytime),
    placeId: String(initialValues.placeId || '').trim(),
    category: String(initialValues.category || '').trim(),
    tags: normalizeTags(initialValues.tags),
    description: String(initialValues.description || '').trim(),
    locationDescription: String(initialValues.locationDescription || '').trim(),
    posterPreviewUrl: String(initialValues.posterPreviewUrl || initialValues.posterUrl || '').trim(),
    galleryPreviewUrls: normalizePreviewUrls(initialValues, 'galleryUrls'),
  };
}

export function renderEventForm(state: EventFormRenderState = {}): string {
  const mode = state.mode === 'edit' ? 'edit' : 'create';
  const initialValues = normalizeInitialValues(state.initialValues);
  const categories = buildSelectOptions(
    Array.isArray(state.categories) ? state.categories : [],
    initialValues.category,
  );
  const places = buildSelectOptions(
    Array.isArray(state.places) ? state.places : [],
    initialValues.placeId,
  );
  const submitLabel = state.submitLabel
    || (mode === 'edit' ? 'Сохранить изменения' : 'Опубликовать событие');

  return renderTemplate('event-form', {
    categories,
    deleteHref: state.deleteHref || '',
    places,
    initialValues,
    submitLabel,
    isEditMode: mode === 'edit',
  });
}

function showFieldError(input: Element | null, errorNode: Element | null, message: string): void {
  if (input instanceof HTMLElement) {
    input.classList.add('event-create-form__input--error');
    input.setAttribute('aria-invalid', 'true');
  }

  if (errorNode instanceof HTMLElement) {
    errorNode.textContent = message;
    errorNode.hidden = false;
  }
}

function clearFieldError(input: Element | null, errorNode: Element | null): void {
  if (input instanceof HTMLElement) {
    input.classList.remove('event-create-form__input--error');
    input.removeAttribute('aria-invalid');
  }

  if (errorNode instanceof HTMLElement) {
    errorNode.textContent = '';
    errorNode.hidden = true;
  }
}

function collectFormValues(form: HTMLFormElement): EventFormValues {
  const formData = new FormData(form);
  const rawScheduleMode = formData.get('scheduleMode');
  const scheduleModeValue = typeof rawScheduleMode === 'string' ? rawScheduleMode : null;
  const scheduleMode: EventFormScheduleMode = isScheduleMode(scheduleModeValue)
    ? scheduleModeValue
    : 'single';

  return {
    title: String(formData.get('title') || '').trim(),
    scheduleMode,
    singleDate: String(formData.get('singleDate') || '').trim(),
    singleStartTime: String(formData.get('singleStartTime') || '').trim(),
    singleEndTime: String(formData.get('singleEndTime') || '').trim(),
    multipleDates: formData
      .getAll('multipleDates')
      .map((value) => String(value || '').trim())
      .filter(Boolean),
    multipleStartTimes: formData
      .getAll('multipleStartTimes')
      .map((value) => String(value || '').trim()),
    multipleEndTimes: formData
      .getAll('multipleEndTimes')
      .map((value) => String(value || '').trim()),
    periodStart: String(formData.get('periodStart') || '').trim(),
    periodEnd: String(formData.get('periodEnd') || '').trim(),
    isAnytime: formData.get('isAnytime') === 'on',
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

function validateRequiredField(
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

function createInputClearHandler(input: Element | null, errorNode: Element | null): () => void {
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

function buildMultipleDateRowHtml(row: Partial<EventFormMultipleRow> = {}): string {
  return `
    <div class="event-create-form__dates-item">
      <label class="event-create-form__field event-create-form__field--compact">
        <span class="event-create-form__label event-create-form__label--small">Дата</span>
        <input
          type="date"
          class="event-create-form__input"
          name="multipleDates"
          data-role="event-create-multiple-date-input"
          value="${String(row.date || '')}"
        />
      </label>
      <label class="event-create-form__field event-create-form__field--compact">
        <span class="event-create-form__label event-create-form__label--small">Начало</span>
        <input
          type="time"
          class="event-create-form__input"
          name="multipleStartTimes"
          data-role="event-create-multiple-time-input"
          value="${String(row.startTime || '')}"
        />
      </label>
      <label class="event-create-form__field event-create-form__field--compact">
        <span class="event-create-form__label event-create-form__label--small">Конец</span>
        <input
          type="time"
          class="event-create-form__input"
          name="multipleEndTimes"
          data-role="event-create-multiple-time-input"
          value="${String(row.endTime || '')}"
        />
      </label>
      <button
        type="button"
        class="event-create-form__dates-remove"
        data-action="event-create-remove-date"
        aria-label="Убрать дату"
      >
        ×
      </button>
    </div>
  `;
}

function createImageFieldController({
  trigger,
  input,
  removeButton,
  initialPreviewUrl = '',
}: ImageFieldControllerOptions): ImageFieldController {
  let file: File | null = null;
  let objectPreviewUrl = '';
  let currentPreviewUrl = String(initialPreviewUrl || '').trim();

  const applyPreview = (nextPreviewUrl: string): void => {
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

  const clear = (): void => {
    file = null;

    if (input instanceof HTMLInputElement) {
      input.value = '';
    }

    if (objectPreviewUrl) {
      URL.revokeObjectURL(objectPreviewUrl);
      objectPreviewUrl = '';
    }

    currentPreviewUrl = '';
    applyPreview('');
  };

  const handleTriggerClick = (): void => {
    if (input instanceof HTMLInputElement) {
      input.click();
    }
  };

  const handleInputChange = (): void => {
    if (!(input instanceof HTMLInputElement)) {
      return;
    }

    const nextFile = input.files?.[0];
    if (!nextFile) {
      return;
    }

    file = nextFile;

    if (objectPreviewUrl) {
      URL.revokeObjectURL(objectPreviewUrl);
    }

    objectPreviewUrl = URL.createObjectURL(nextFile);
    currentPreviewUrl = objectPreviewUrl;
    applyPreview(currentPreviewUrl);
  };

  const handleRemoveClick = (event: Event): void => {
    event.preventDefault();
    event.stopPropagation();
    clear();
  };

  const bind = (): void => {
    applyPreview(currentPreviewUrl);
    trigger?.addEventListener('click', handleTriggerClick);
    input?.addEventListener('change', handleInputChange);
    removeButton?.addEventListener('click', handleRemoveClick);
  };

  const unbind = (): void => {
    trigger?.removeEventListener('click', handleTriggerClick);
    input?.removeEventListener('change', handleInputChange);
    removeButton?.removeEventListener('click', handleRemoveClick);

    if (objectPreviewUrl) {
      URL.revokeObjectURL(objectPreviewUrl);
      objectPreviewUrl = '';
    }
  };

  return {
    bind,
    unbind,
    clear,
    getFile: () => file,
  };
}

export function attachEventForm(root: ParentNode, options: EventFormOptions = {}): () => void {
  const form = root.querySelector<HTMLFormElement>('[data-role="event-create-form"]');
  const cancelButton = root.querySelector<HTMLButtonElement>('[data-action="event-create-cancel"]');
  const titleInput = root.querySelector<HTMLInputElement>('[data-role="event-create-title"]');
  const titleError = root.querySelector<HTMLElement>('[data-role="event-create-title-error"]');
  const dateInput = root.querySelector<HTMLInputElement>('[data-role="event-create-date"]');
  const startTimeInput = root.querySelector<HTMLInputElement>('[data-role="event-create-start-time"]');
  const endTimeInput = root.querySelector<HTMLInputElement>('[data-role="event-create-end-time"]');
  const dateError = root.querySelector<HTMLElement>('[data-role="event-create-date-error"]');
  const scheduleModeInputs = Array.from(root.querySelectorAll<HTMLInputElement>('[data-role="event-create-schedule-mode"]'));
  const schedulePanels = Array.from(root.querySelectorAll<HTMLElement>('[data-role="event-create-schedule-panel"]'));
  const multipleDatesList = root.querySelector<HTMLElement>('[data-role="event-create-multiple-dates-list"]');
  const addDateButton = root.querySelector<HTMLButtonElement>('[data-action="event-create-add-date"]');
  const periodStartInput = root.querySelector<HTMLInputElement>('[data-role="event-create-period-start"]');
  const periodEndInput = root.querySelector<HTMLInputElement>('[data-role="event-create-period-end"]');
  const anytimeInput = root.querySelector<HTMLInputElement>('[data-role="event-create-anytime"]');
  const placeInput = root.querySelector<HTMLSelectElement>('[data-role="event-create-place"]');
  const placeError = root.querySelector<HTMLElement>('[data-role="event-create-place-error"]');
  const categoryInput = root.querySelector<HTMLSelectElement>('[data-role="event-create-category"]');
  const categoryError = root.querySelector<HTMLElement>('[data-role="event-create-category-error"]');
  const descriptionInput = root.querySelector<HTMLTextAreaElement>('[data-role="event-create-description"]');
  const descriptionError = root.querySelector<HTMLElement>('[data-role="event-create-description-error"]');
  const locationDescriptionInput = root.querySelector<HTMLTextAreaElement>('[data-role="event-create-location-description"]');
  const locationDescriptionError = root.querySelector<HTMLElement>('[data-role="event-create-location-description-error"]');
  const posterTrigger = root.querySelector<HTMLElement>('[data-role="event-create-poster-trigger"]');
  const posterInput = root.querySelector<HTMLInputElement>('[data-role="event-create-poster-input"]');
  const posterRemoveButton = root.querySelector<HTMLButtonElement>('[data-role="event-create-poster-remove"]');
  const galleryTriggers = Array.from(root.querySelectorAll<HTMLElement>('[data-role="event-create-gallery-trigger"]'));
  const galleryInputs = Array.from(root.querySelectorAll<HTMLInputElement>('[data-role="event-create-gallery-input"]'));
  const galleryRemoveButtons = Array.from(root.querySelectorAll<HTMLButtonElement>('[data-role="event-create-gallery-remove"]'));
  const posterController = createImageFieldController({
    trigger: posterTrigger,
    input: posterInput,
    removeButton: posterRemoveButton,
    initialPreviewUrl: posterTrigger instanceof HTMLElement ? posterTrigger.dataset.previewUrl : '',
  });
  const galleryControllers = galleryTriggers.map((trigger, index) => createImageFieldController({
    trigger,
    input: galleryInputs[index],
    removeButton: galleryRemoveButtons[index],
    initialPreviewUrl: trigger instanceof HTMLElement ? trigger.dataset.previewUrl : '',
  }));
  const handleTitleInput = createInputClearHandler(titleInput, titleError);
  const handleDateChange = createInputClearHandler(dateInput, dateError);
  const handleStartTimeChange = createInputClearHandler(startTimeInput, dateError);
  const handleEndTimeChange = createInputClearHandler(endTimeInput, dateError);
  const handlePeriodStartChange = createInputClearHandler(periodStartInput, dateError);
  const handlePeriodEndChange = createInputClearHandler(periodEndInput, dateError);
  const handlePlaceInput = createInputClearHandler(placeInput, placeError);
  const handleCategoryChange = createInputClearHandler(categoryInput, categoryError);
  const handleDescriptionInput = createInputClearHandler(descriptionInput, descriptionError);
  const handleLocationDescriptionInput = createInputClearHandler(
    locationDescriptionInput,
    locationDescriptionError,
  );

  const handleSubmit = (event: SubmitEvent): void => {
    event.preventDefault();

    if (!(form instanceof HTMLFormElement)) {
      return;
    }

    const values = collectFormValues(form);

    if (!validateRequiredField(values.title, titleInput, titleError, 'Укажи название события')) {
      return;
    }

    if (!values.isAnytime) {
      if (values.scheduleMode === 'single') {
        if (!validateRequiredField(values.singleDate, dateInput, dateError, 'Укажи дату события')) {
          return;
        }
      } else if (values.scheduleMode === 'multiple') {
        if (!values.multipleDates.length) {
          showFieldError(dateInput, dateError, 'Добавь хотя бы одну дату');
          dateInput?.focus();
          return;
        }

        clearFieldError(dateInput, dateError);
      } else if (values.scheduleMode === 'period') {
        if (!validateRequiredField(periodStartInput?.value?.trim() || '', periodStartInput, dateError, 'Укажи дату начала')) {
          return;
        }

        if (!validateRequiredField(periodEndInput?.value?.trim() || '', periodEndInput, dateError, 'Укажи дату окончания')) {
          return;
        }

        if (values.periodEnd < values.periodStart) {
          showFieldError(periodEndInput, dateError, 'Дата окончания не может быть раньше даты начала');
          periodEndInput?.focus();
          return;
        }

        clearFieldError(periodEndInput, dateError);
      }
    } else {
      clearFieldError(dateInput, dateError);
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
        .filter((file): file is File => Boolean(file)),
    };

    if (typeof options.onSubmit === 'function') {
      options.onSubmit(payload, form, event);
    }
  };

  const syncAnytimeState = (): void => {
    if (!(anytimeInput instanceof HTMLInputElement)) {
      return;
    }

    const shouldDisableSchedule = anytimeInput.checked;

    if (dateInput instanceof HTMLInputElement) {
      dateInput.disabled = shouldDisableSchedule;
    }

    scheduleModeInputs.forEach((input) => {
      if (input instanceof HTMLInputElement) {
        input.disabled = shouldDisableSchedule;
      }
    });

    const multipleScheduleInputs = Array.from(root.querySelectorAll(
      '[data-role="event-create-multiple-date-input"], [data-role="event-create-multiple-time-input"]',
    ));
    multipleScheduleInputs.forEach((input) => {
      if (input instanceof HTMLInputElement) {
        input.disabled = shouldDisableSchedule;
      }
    });

    if (periodStartInput instanceof HTMLInputElement) {
      periodStartInput.disabled = shouldDisableSchedule;
    }

    if (periodEndInput instanceof HTMLInputElement) {
      periodEndInput.disabled = shouldDisableSchedule;
    }

    if (addDateButton instanceof HTMLButtonElement) {
      addDateButton.disabled = shouldDisableSchedule;
    }

    if (anytimeInput.checked) {
      if (dateInput instanceof HTMLInputElement) {
        dateInput.value = '';
      }

      if (startTimeInput instanceof HTMLInputElement) {
        startTimeInput.value = '';
      }

      if (endTimeInput instanceof HTMLInputElement) {
        endTimeInput.value = '';
      }

      clearFieldError(dateInput, dateError);
    }
  };

  const syncScheduleMode = (): void => {
    const activeMode = scheduleModeInputs.find((input) => input instanceof HTMLInputElement && input.checked)?.value || 'single';

    schedulePanels.forEach((panel) => {
      if (!(panel instanceof HTMLElement)) {
        return;
      }

      panel.hidden = panel.dataset.mode !== activeMode;
    });

    clearFieldError(dateInput, dateError);
  };

  const handleScheduleModeChange = (): void => {
    syncScheduleMode();
    syncAnytimeState();
  };

  const handleAddDate = (): void => {
    if (!(multipleDatesList instanceof HTMLElement)) {
      return;
    }

    multipleDatesList.insertAdjacentHTML('beforeend', buildMultipleDateRowHtml());
  };

  const handleMultipleDatesClick = (event: Event): void => {
    if (!(event.target instanceof Element)) {
      return;
    }

    const removeButton = event.target.closest('[data-action="event-create-remove-date"]');

    if (!(removeButton instanceof HTMLButtonElement) || !(multipleDatesList instanceof HTMLElement)) {
      return;
    }

    const items = Array.from(multipleDatesList.querySelectorAll('.event-create-form__dates-item'));
    const currentItem = removeButton.closest('.event-create-form__dates-item');

    if (!(currentItem instanceof HTMLElement)) {
      return;
    }

    if (items.length <= 1) {
      const input = currentItem.querySelector('[data-role="event-create-multiple-date-input"]');

      if (input instanceof HTMLInputElement) {
        input.value = '';
        input.focus();
      }

      return;
    }

    currentItem.remove();
  };

  const handleMultipleDatesChange = (event: Event): void => {
    if (!(event.target instanceof Element)) {
      return;
    }

    const input = event.target.closest('[data-role="event-create-multiple-date-input"]');

    if (!(input instanceof HTMLInputElement)) {
      return;
    }

    if (input.value.trim()) {
      clearFieldError(dateInput, dateError);
    }
  };

  const handleCancelClick = (): void => {
    options.onCancel?.();
  };

  if (!(form instanceof HTMLFormElement)) {
    return () => {};
  }

  syncScheduleMode();
  syncAnytimeState();
  posterController.bind();
  galleryControllers.forEach((controller) => controller.bind());

  form.addEventListener('submit', handleSubmit);
  if (cancelButton instanceof HTMLButtonElement) {
    cancelButton.addEventListener('click', handleCancelClick);
  }
  titleInput?.addEventListener('input', handleTitleInput);
  dateInput?.addEventListener('input', handleDateChange);
  startTimeInput?.addEventListener('input', handleStartTimeChange);
  endTimeInput?.addEventListener('input', handleEndTimeChange);
  periodStartInput?.addEventListener('input', handlePeriodStartChange);
  periodEndInput?.addEventListener('input', handlePeriodEndChange);
  anytimeInput?.addEventListener('change', syncAnytimeState);
  placeInput?.addEventListener('change', handlePlaceInput);
  categoryInput?.addEventListener('change', handleCategoryChange);
  descriptionInput?.addEventListener('input', handleDescriptionInput);
  locationDescriptionInput?.addEventListener('input', handleLocationDescriptionInput);
  scheduleModeInputs.forEach((input) => input?.addEventListener('change', handleScheduleModeChange));
  addDateButton?.addEventListener('click', handleAddDate);
  multipleDatesList?.addEventListener('click', handleMultipleDatesClick);
  multipleDatesList?.addEventListener('input', handleMultipleDatesChange);

  return () => {
    posterController.unbind();
    galleryControllers.forEach((controller) => controller.unbind());
    form.removeEventListener('submit', handleSubmit);
    if (cancelButton instanceof HTMLButtonElement) {
      cancelButton.removeEventListener('click', handleCancelClick);
    }
    titleInput?.removeEventListener('input', handleTitleInput);
    dateInput?.removeEventListener('input', handleDateChange);
    startTimeInput?.removeEventListener('input', handleStartTimeChange);
    endTimeInput?.removeEventListener('input', handleEndTimeChange);
    periodStartInput?.removeEventListener('input', handlePeriodStartChange);
    periodEndInput?.removeEventListener('input', handlePeriodEndChange);
    anytimeInput?.removeEventListener('change', syncAnytimeState);
    placeInput?.removeEventListener('change', handlePlaceInput);
    categoryInput?.removeEventListener('change', handleCategoryChange);
    descriptionInput?.removeEventListener('input', handleDescriptionInput);
    locationDescriptionInput?.removeEventListener('input', handleLocationDescriptionInput);
    scheduleModeInputs.forEach((input) => input?.removeEventListener('change', handleScheduleModeChange));
    addDateButton?.removeEventListener('click', handleAddDate);
    multipleDatesList?.removeEventListener('click', handleMultipleDatesClick);
    multipleDatesList?.removeEventListener('input', handleMultipleDatesChange);
  };
}
