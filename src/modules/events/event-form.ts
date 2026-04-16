import { renderTemplate } from '../../app/templates/renderer.js';
import type {
  EventFormInitialValues,
  EventFormScheduleMode,
  EventFormValues,
} from './event-form-payload.js';
import {
  buildImageUrls,
  createImageFieldController,
} from './event-form-image-controller.js';
import type { ImageFieldController } from './event-form-image-controller.js';
import type { EventFormSelectOption } from './event-form-reference-data.js';
import { createEventFormScheduleController } from './event-form-schedule-controller.js';
import { getEventFormElements } from './event-form-selectors.js';
import { createEventFormValidator } from './event-form-validation.js';

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
  imageUrls: string[];
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

export function attachEventForm(root: ParentNode, options: EventFormOptions = {}): () => void {
  const elements = getEventFormElements(root);
  const {
    cancelButton,
    form,
    galleryInputs,
    galleryRemoveButtons,
    galleryTriggers,
    posterInput,
    posterRemoveButton,
    posterTrigger,
  } = elements;

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

  const scheduleController = createEventFormScheduleController(elements);
  const validator = createEventFormValidator({
    elements,
    scheduleController,
  });

  const handleSubmit = async (event: SubmitEvent): Promise<void> => {
    event.preventDefault();

    if (!(form instanceof HTMLFormElement)) {
      return;
    }

    const values = collectFormValues(form);

    if (!validator.validate(values)) {
      return;
    }

    const payload = {
      ...values,
      imageUrls: await buildImageUrls(posterController, galleryControllers),
    };

    if (typeof options.onSubmit === 'function') {
      options.onSubmit(payload, form, event);
    }
  };

  const handleCancelClick = (): void => {
    options.onCancel?.();
  };

  if (!(form instanceof HTMLFormElement)) {
    return () => {};
  }

  scheduleController.bind();
  validator.bind();
  posterController.bind();
  galleryControllers.forEach((controller) => controller.bind());

  form.addEventListener('submit', handleSubmit);
  if (cancelButton instanceof HTMLButtonElement) {
    cancelButton.addEventListener('click', handleCancelClick);
  }

  return () => {
    validator.unbind();
    scheduleController.unbind();
    posterController.unbind();
    galleryControllers.forEach((controller) => controller.unbind());
    form.removeEventListener('submit', handleSubmit);
    if (cancelButton instanceof HTMLButtonElement) {
      cancelButton.removeEventListener('click', handleCancelClick);
    }
  };
}
