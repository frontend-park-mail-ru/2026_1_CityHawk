import { renderTemplate } from '../../../app/templates/renderer.js';
import { showToast } from '../../../app/ui/toast.js';
import { getPlaceSuggestions, resolvePlaceSuggestion } from '../../../api/places.api.js';
import type {
  EventFormInitialValues,
  EventFormScheduleMode,
  EventFormValues,
} from './event-form-payload.js';
import {
  buildImageData,
  createImageFieldController,
} from './event-form-image-controller.js';
import type { ImageFieldController } from './event-form-image-controller.js';
import type { EventFormSelectOption } from './event-form-reference-data.js';
import { createEventFormScheduleController } from './event-form-schedule-controller.js';
import { getEventFormElements } from './event-form-selectors.js';
import { createEventFormValidator } from './event-form-validation.js';

const GALLERY_PREVIEW_SLOTS = 4;
const PLACE_SUGGESTIONS_LIMIT = 5;

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
  placeQuery: string;
  category: string;
  categoryQuery: string;
  tags: string;
  description: string;
  locationDescription: string;
  posterPreviewUrl: string;
  galleryPreviewUrls: string[];
}

export interface EventFormSubmitPayload extends EventFormValues {
  imageUrls: string[];
  imageFiles: File[];
}

export interface EventFormRenderState {
  mode?: 'create' | 'edit';
  submitLabel?: string;
  categories?: EventFormSelectOption[];
  places?: EventFormSelectOption[];
  tags?: EventFormSelectOption[];
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
    placeQuery: '',
    category: String(initialValues.category || '').trim(),
    categoryQuery: '',
    tags: normalizeTags(initialValues.tags),
    description: String(initialValues.description || '').trim(),
    locationDescription: String(initialValues.locationDescription || '').trim(),
    posterPreviewUrl: String(initialValues.posterPreviewUrl || initialValues.posterUrl || '').trim(),
    galleryPreviewUrls: normalizePreviewUrls(initialValues, 'galleryUrls'),
  };
}

function findOptionLabelByValue(items: EventFormSelectOption[], value: string): string {
  const normalizedValue = String(value || '').trim();

  if (!normalizedValue) {
    return '';
  }

  const option = items.find((item) => String(item.value || '').trim() === normalizedValue);
  return String(option?.label || '').trim();
}

function resolveReferenceId(
  root: ParentNode,
  listRole: string,
  rawValue: FormDataEntryValue | null,
  config: { allowRawValue?: boolean } = {},
): string {
  const value = String(rawValue || '').trim();

  if (!value) {
    return '';
  }

  const datalist = root.querySelector<HTMLElement>(`[data-role="${listRole}"]`);
  if (!(datalist instanceof HTMLDataListElement)) {
    return value;
  }

  const normalizedValue = value.toLowerCase();
  const options = Array.from(datalist.querySelectorAll<HTMLOptionElement>('option'));
  const matchedByLabel = options.find((option) => String(option.value || '').trim().toLowerCase() === normalizedValue);
  const mappedId = String(matchedByLabel?.dataset.id || '').trim();

  if (mappedId) {
    return mappedId;
  }

  if (config.allowRawValue) {
    return value;
  }

  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
  return isUuid ? value : '';
}

function resolveReferenceIdsFromCsv(
  root: ParentNode,
  listRole: string,
  rawValue: FormDataEntryValue | null,
): string[] {
  const value = String(rawValue || '').trim();

  if (!value) {
    return [];
  }

  const datalist = root.querySelector<HTMLElement>(`[data-role="${listRole}"]`);
  const options = datalist instanceof HTMLDataListElement
    ? Array.from(datalist.querySelectorAll<HTMLOptionElement>('option'))
    : [];

  const labelToId = new Map<string, string>();
  options.forEach((option) => {
    const label = String(option.value || '').trim().toLowerCase();
    const id = String(option.dataset.id || '').trim();

    if (label && id) {
      labelToId.set(label, id);
    }
  });

  const isUuid = (candidate: string): boolean => /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(candidate);

  return Array.from(new Set(
    value
      .split(',')
      .map((part) => String(part || '').trim())
      .filter(Boolean)
      .map((part) => labelToId.get(part.toLowerCase()) || part)
      .filter((part) => isUuid(part)),
  ));
}

function isUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

interface PlaceLookupController {
  resolvePlaceValue: (rawValue: string) => Promise<string>;
  unbind: () => void;
}

function createPlaceLookupController(form: HTMLFormElement): PlaceLookupController {
  const input = form.querySelector<HTMLInputElement>('[data-role="event-create-place"]');
  const datalist = form.querySelector<HTMLDataListElement>('[data-role="event-create-place-options"]');
  const hint = form.querySelector<HTMLElement>('[data-role="event-create-place-hint"]');

  if (!(input instanceof HTMLInputElement) || !(datalist instanceof HTMLDataListElement)) {
    return {
      resolvePlaceValue: async (rawValue) => rawValue,
      unbind: () => {},
    };
  }

  const labelToToken = new Map<string, string>();
  let timer: number | undefined;
  let requestID = 0;

  const setHint = (message = ''): void => {
    if (!(hint instanceof HTMLElement)) {
      return;
    }

    hint.textContent = message;
    hint.hidden = !message;
  };

  const clearOptions = (): void => {
    labelToToken.clear();
    datalist.innerHTML = '';
    setHint('');
  };

  const renderOptions = (items: Array<{ token?: string; label?: string }>): void => {
    clearOptions();

    items.forEach((item) => {
      const label = String(item?.label || '').trim();
      const token = String(item?.token || '').trim();

      if (!label || !token) {
        return;
      }

      labelToToken.set(label.toLowerCase(), token);
      const option = document.createElement('option');
      option.value = label;
      option.dataset.token = token;
      datalist.append(option);
    });
  };

  const loadSuggestions = async (rawQuery: string): Promise<void> => {
    const query = rawQuery.trim();

    if (query.length < 2) {
      clearOptions();
      return;
    }

    const current = ++requestID;
    setHint('Ищем места...');

    try {
      const response = await getPlaceSuggestions(query, PLACE_SUGGESTIONS_LIMIT);

      if (current !== requestID) {
        return;
      }

      const items = Array.isArray(response?.items) ? response.items : [];
      renderOptions(items);
      setHint(items.length ? '' : 'Ничего не найдено');
    } catch {
      if (current === requestID) {
        clearOptions();
        setHint('Не удалось загрузить подсказки');
      }
    }
  };

  const scheduleLoad = (): void => {
    if (timer !== undefined) {
      window.clearTimeout(timer);
    }

    timer = window.setTimeout(() => {
      void loadSuggestions(input.value);
    }, 250);
  };

  const handleInput = (): void => {
    scheduleLoad();
  };

  const handleFocus = (): void => {
    if (input.value.trim().length >= 2) {
      scheduleLoad();
    }
  };

  const handleBlur = (): void => {
    const value = input.value.trim();
    if (value.length < 2) {
      setHint('');
    }
  };

  input.addEventListener('input', handleInput);
  input.addEventListener('focus', handleFocus);
  input.addEventListener('blur', handleBlur);

  return {
    async resolvePlaceValue(rawValue: string): Promise<string> {
      const value = String(rawValue || '').trim();

      if (!value || isUuid(value)) {
        return value;
      }

      const token = labelToToken.get(value.toLowerCase());

      if (!token) {
        return value;
      }

      const resolved = await resolvePlaceSuggestion(token);
      const resolvedPlaceID = String(resolved?.id || '').trim();

      if (!resolvedPlaceID) {
        throw new Error('Не удалось подтвердить выбранное место');
      }

      return resolvedPlaceID;
    },
    unbind(): void {
      if (timer !== undefined) {
        window.clearTimeout(timer);
      }

      input.removeEventListener('input', handleInput);
      input.removeEventListener('focus', handleFocus);
      input.removeEventListener('blur', handleBlur);
      setHint('');
    },
  };
}

function attachTagPicker(form: HTMLFormElement): () => void {
  const selectedContainer = form.querySelector<HTMLElement>('[data-role="event-create-tags-selected"]');
  const input = form.querySelector<HTMLInputElement>('[data-role="event-create-tags-input"]');
  const hidden = form.querySelector<HTMLInputElement>('[data-role="event-create-tags-hidden"]');
  const datalist = form.querySelector<HTMLDataListElement>('[data-role="event-create-tag-options"]');

  if (!(selectedContainer instanceof HTMLElement)
    || !(input instanceof HTMLInputElement)
    || !(hidden instanceof HTMLInputElement)) {
    return () => {};
  }

  const isUuid = (candidate: string): boolean => /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(candidate);

  const labelToId = new Map<string, string>();
  const idToLabel = new Map<string, string>();

  if (datalist instanceof HTMLDataListElement) {
    Array.from(datalist.querySelectorAll<HTMLOptionElement>('option')).forEach((option) => {
      const label = String(option.value || '').trim();
      const id = String(option.dataset.id || '').trim();

      if (label && id) {
        labelToId.set(label.toLowerCase(), id);
        idToLabel.set(id, label);
      }
    });
  }

  const selectedIds = new Set<string>();

  const resolveTagId = (rawValue: string): string => {
    const normalized = String(rawValue || '').trim();
    if (!normalized) {
      return '';
    }

    const mapped = labelToId.get(normalized.toLowerCase()) || normalized;
    return isUuid(mapped) ? mapped : '';
  };

  const syncFromHidden = () => {
    selectedIds.clear();

    hidden.value
      .split(',')
      .map((part) => String(part || '').trim())
      .filter(Boolean)
      .map((part) => resolveTagId(part))
      .filter(Boolean)
      .forEach((id) => selectedIds.add(id));
  };

  const render = () => {
    hidden.value = Array.from(selectedIds).join(', ');
    selectedContainer.innerHTML = '';

    Array.from(selectedIds).forEach((id) => {
      const chip = document.createElement('span');
      chip.className = 'event-create-form__tag-chip';

      const text = document.createElement('span');
      text.textContent = idToLabel.get(id) || id;
      chip.append(text);

      const removeButton = document.createElement('button');
      removeButton.type = 'button';
      removeButton.className = 'event-create-form__tag-chip-remove';
      removeButton.dataset.id = id;
      removeButton.setAttribute('aria-label', 'Удалить тег');
      removeButton.textContent = '×';
      chip.append(removeButton);

      selectedContainer.append(chip);
    });
  };

  const commitInputValue = (): void => {
    const nextId = resolveTagId(input.value);

    if (!nextId) {
      return;
    }

    selectedIds.add(nextId);
    input.value = '';
    render();
  };

  const handleInputKeyDown = (event: KeyboardEvent): void => {
    if (event.key === 'Enter' || event.key === ',') {
      event.preventDefault();
      commitInputValue();
    }
  };

  const handleInputChange = (): void => {
    commitInputValue();
  };

  const handleInputBlur = (): void => {
    commitInputValue();
  };

  const handleSelectedClick = (event: Event): void => {
    const target = event.target;

    if (!(target instanceof Element)) {
      return;
    }

    const button = target.closest<HTMLButtonElement>('.event-create-form__tag-chip-remove');

    if (!(button instanceof HTMLButtonElement)) {
      return;
    }

    const id = String(button.dataset.id || '').trim();

    if (!id) {
      return;
    }

    selectedIds.delete(id);
    render();
  };

  syncFromHidden();
  render();

  input.addEventListener('keydown', handleInputKeyDown);
  input.addEventListener('change', handleInputChange);
  input.addEventListener('blur', handleInputBlur);
  selectedContainer.addEventListener('click', handleSelectedClick);

  return () => {
    input.removeEventListener('keydown', handleInputKeyDown);
    input.removeEventListener('change', handleInputChange);
    input.removeEventListener('blur', handleInputBlur);
    selectedContainer.removeEventListener('click', handleSelectedClick);
  };
}

function attachStyledDatalistDropdowns(form: HTMLFormElement): () => void {
  const detachList: Array<() => void> = [];
  const inputSelectors = [
    '[data-role="event-create-place"]',
    '[data-role="event-create-category"]',
    '[data-role="event-create-tags-input"]',
  ];

  inputSelectors.forEach((selector) => {
    const input = form.querySelector<HTMLInputElement>(selector);
    if (!(input instanceof HTMLInputElement)) {
      return;
    }

    const listID = String(input.getAttribute('list') || '').trim();
    if (!listID) {
      return;
    }

    const datalist = form.querySelector<HTMLDataListElement>(`#${listID}`);
    if (!(datalist instanceof HTMLDataListElement)) {
      return;
    }

    const field = input.closest<HTMLElement>('.event-create-form__field')
      || input.closest<HTMLElement>('.event-create-form__tags')
      || input.parentElement;
    if (!(field instanceof HTMLElement)) {
      return;
    }

    const dropdown = document.createElement('div');
    dropdown.className = 'event-create-form__dropdown';
    dropdown.hidden = true;
    field.append(dropdown);

    const originalListID = listID;
    input.removeAttribute('list');
    input.setAttribute('autocomplete', 'off');

    let isOpen = false;

    const readItems = (): Array<{ label: string }> => Array.from(datalist.querySelectorAll<HTMLOptionElement>('option'))
      .map((option) => ({ label: String(option.value || '').trim() }))
      .filter((item) => Boolean(item.label));

    const hideDropdown = (): void => {
      isOpen = false;
      dropdown.hidden = true;
      dropdown.innerHTML = '';
    };

    const renderDropdown = (): void => {
      const query = input.value.trim().toLowerCase();
      const items = readItems()
        .filter((item) => !query || item.label.toLowerCase().includes(query))
        .slice(0, 8);

      if (!items.length) {
        hideDropdown();
        return;
      }

      dropdown.innerHTML = '';
      items.forEach((item) => {
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'event-create-form__dropdown-option';
        button.dataset.value = item.label;
        button.textContent = item.label;
        dropdown.append(button);
      });

      isOpen = true;
      dropdown.hidden = false;
    };

    const handleInput = (): void => {
      renderDropdown();
    };

    const handleFocus = (): void => {
      renderDropdown();
    };

    const handleDocumentClick = (event: Event): void => {
      const target = event.target;
      if (!(target instanceof Node)) {
        return;
      }

      if (!field.contains(target)) {
        hideDropdown();
      }
    };

    const handleDropdownClick = (event: Event): void => {
      const target = event.target;
      if (!(target instanceof Element)) {
        return;
      }

      const optionButton = target.closest<HTMLButtonElement>('.event-create-form__dropdown-option');
      if (!(optionButton instanceof HTMLButtonElement)) {
        return;
      }

      const value = String(optionButton.dataset.value || '').trim();
      if (!value) {
        return;
      }

      input.value = value;
      input.dispatchEvent(new Event('input', { bubbles: true }));
      input.dispatchEvent(new Event('change', { bubbles: true }));
      hideDropdown();
      input.focus();
    };

    const handleKeyDown = (event: KeyboardEvent): void => {
      if (event.key === 'Escape' && isOpen) {
        hideDropdown();
      }
    };

    const observer = new MutationObserver(() => {
      if (isOpen) {
        renderDropdown();
      }
    });
    observer.observe(datalist, { childList: true, subtree: true, characterData: true });

    input.addEventListener('input', handleInput);
    input.addEventListener('focus', handleFocus);
    input.addEventListener('keydown', handleKeyDown);
    dropdown.addEventListener('click', handleDropdownClick);
    document.addEventListener('click', handleDocumentClick);

    detachList.push(() => {
      observer.disconnect();
      hideDropdown();
      input.setAttribute('list', originalListID);
      input.removeEventListener('input', handleInput);
      input.removeEventListener('focus', handleFocus);
      input.removeEventListener('keydown', handleKeyDown);
      dropdown.removeEventListener('click', handleDropdownClick);
      document.removeEventListener('click', handleDocumentClick);
      dropdown.remove();
    });
  });

  return () => {
    detachList.forEach((detach) => detach());
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
  const tags = Array.isArray(state.tags) ? state.tags : [];
  const resolvedInitialValues = {
    ...initialValues,
    placeQuery: initialValues.placeQuery || findOptionLabelByValue(places, initialValues.placeId) || initialValues.placeId,
    categoryQuery: initialValues.categoryQuery
      || findOptionLabelByValue(categories, initialValues.category)
      || initialValues.category,
  };
  const submitLabel = state.submitLabel
    || (mode === 'edit' ? 'Сохранить изменения' : 'Опубликовать событие');

  return renderTemplate('event-form', {
    categories,
    deleteHref: state.deleteHref || '',
    places,
    tags,
    initialValues: resolvedInitialValues,
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
    placeId: resolveReferenceId(
      form,
      'event-create-place-options',
      formData.get('place'),
      { allowRawValue: true },
    ),
    category: resolveReferenceId(form, 'event-create-category-options', formData.get('category')),
    tags: resolveReferenceIdsFromCsv(form, 'event-create-tag-options', formData.get('tags')),
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
  const placeLookup = form instanceof HTMLFormElement
    ? createPlaceLookupController(form)
    : {
      resolvePlaceValue: async (rawValue: string): Promise<string> => rawValue,
      unbind: () => {},
    };

  const handleSubmit = async (event: SubmitEvent): Promise<void> => {
    event.preventDefault();

    if (!(form instanceof HTMLFormElement)) {
      return;
    }

    const values = collectFormValues(form);
    values.placeId = await placeLookup.resolvePlaceValue(values.placeId);

    if (!validator.validate(values)) {
      return;
    }

    try {
      const imageData = await buildImageData(posterController, galleryControllers);
      const payload = {
        ...values,
        ...imageData,
      };

      if (typeof options.onSubmit === 'function') {
        options.onSubmit(payload, form, event);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Не удалось подготовить изображения';
      showToast(message, { type: 'error' });
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
  const detachTagPicker = attachTagPicker(form);
  const detachStyledDropdowns = attachStyledDatalistDropdowns(form);
  posterController.bind();
  galleryControllers.forEach((controller) => controller.bind());

  form.addEventListener('submit', handleSubmit);
  if (cancelButton instanceof HTMLButtonElement) {
    cancelButton.addEventListener('click', handleCancelClick);
  }

  return () => {
    validator.unbind();
    scheduleController.unbind();
    detachTagPicker();
    detachStyledDropdowns();
    placeLookup.unbind();
    posterController.unbind();
    galleryControllers.forEach((controller) => controller.unbind());
    form.removeEventListener('submit', handleSubmit);
    if (cancelButton instanceof HTMLButtonElement) {
      cancelButton.removeEventListener('click', handleCancelClick);
    }
  };
}
