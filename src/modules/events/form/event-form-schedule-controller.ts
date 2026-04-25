import { renderTemplate } from '../../../app/templates/renderer.js';
import type { EventFormValues } from './event-form-payload.js';
import type { EventFormElements } from './event-form-selectors.js';
import {
  clearFieldError,
  createInputClearHandler,
  showFieldError,
  validateRequiredField,
} from './event-form-validation.js';

export interface EventFormScheduleController {
  bind: () => void;
  unbind: () => void;
  validate: (values: EventFormValues) => boolean;
}

function buildMultipleDateRowHtml(): string {
  return renderTemplate('event-form-multiple-date-row');
}

export function createEventFormScheduleController(elements: EventFormElements): EventFormScheduleController {
  const handleDateChange = createInputClearHandler(elements.dateInput, elements.dateError);
  const handleStartTimeChange = createInputClearHandler(elements.startTimeInput, elements.dateError);
  const handleEndTimeChange = createInputClearHandler(elements.endTimeInput, elements.dateError);
  const handlePeriodStartChange = createInputClearHandler(elements.periodStartInput, elements.dateError);
  const handlePeriodEndChange = createInputClearHandler(elements.periodEndInput, elements.dateError);

  const syncAnytimeState = (): void => {
    if (!(elements.anytimeInput instanceof HTMLInputElement)) {
      return;
    }

    const shouldDisableSchedule = elements.anytimeInput.checked;

    if (shouldDisableSchedule) {
      elements.schedulePanels.forEach((panel) => {
        if (panel instanceof HTMLElement) {
          panel.hidden = true;
        }
      });
    } else {
      syncScheduleMode();
    }

    if (elements.dateInput instanceof HTMLInputElement) {
      elements.dateInput.disabled = shouldDisableSchedule;
    }

    elements.scheduleModeInputs.forEach((input) => {
      if (input instanceof HTMLInputElement) {
        input.disabled = shouldDisableSchedule;
      }
    });

    const multipleScheduleInputs = Array.from((elements.form || document).querySelectorAll(
      '[data-role="event-create-multiple-date-input"], [data-role="event-create-multiple-time-input"]',
    ));
    multipleScheduleInputs.forEach((input) => {
      if (input instanceof HTMLInputElement) {
        input.disabled = shouldDisableSchedule;
      }
    });

    if (elements.periodStartInput instanceof HTMLInputElement) {
      elements.periodStartInput.disabled = shouldDisableSchedule;
    }

    if (elements.periodEndInput instanceof HTMLInputElement) {
      elements.periodEndInput.disabled = shouldDisableSchedule;
    }

    if (elements.addDateButton instanceof HTMLButtonElement) {
      elements.addDateButton.disabled = shouldDisableSchedule;
    }

    if (elements.anytimeInput.checked) {
      if (elements.dateInput instanceof HTMLInputElement) {
        elements.dateInput.value = '';
      }

      if (elements.startTimeInput instanceof HTMLInputElement) {
        elements.startTimeInput.value = '';
      }

      if (elements.endTimeInput instanceof HTMLInputElement) {
        elements.endTimeInput.value = '';
      }

      clearFieldError(elements.dateInput, elements.dateError);
    }
  };

  const syncScheduleMode = (): void => {
    const activeMode = elements.scheduleModeInputs.find((input) => input instanceof HTMLInputElement && input.checked)?.value || 'single';

    elements.schedulePanels.forEach((panel) => {
      if (!(panel instanceof HTMLElement)) {
        return;
      }

      panel.hidden = panel.dataset.mode !== activeMode;
    });

    clearFieldError(elements.dateInput, elements.dateError);
  };

  const handleScheduleModeChange = (): void => {
    syncScheduleMode();
    syncAnytimeState();
  };

  const handleAddDate = (): void => {
    if (!(elements.multipleDatesList instanceof HTMLElement)) {
      return;
    }

    elements.multipleDatesList.insertAdjacentHTML('beforeend', buildMultipleDateRowHtml());
  };

  const handleMultipleDatesClick = (event: Event): void => {
    if (!(event.target instanceof Element)) {
      return;
    }

    const removeButton = event.target.closest('[data-action="event-create-remove-date"]');

    if (!(removeButton instanceof HTMLButtonElement) || !(elements.multipleDatesList instanceof HTMLElement)) {
      return;
    }

    const items = Array.from(elements.multipleDatesList.querySelectorAll('.event-create-form__dates-item'));
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
      clearFieldError(elements.dateInput, elements.dateError);
    }
  };

  const validate = (values: EventFormValues): boolean => {
    if (values.isAnytime) {
      clearFieldError(elements.dateInput, elements.dateError);
      return true;
    }

    if (values.scheduleMode === 'single') {
      return validateRequiredField(values.singleDate, elements.dateInput, elements.dateError, 'Укажи дату события');
    }

    if (values.scheduleMode === 'multiple') {
      if (!values.multipleDates.length) {
        showFieldError(elements.dateInput, elements.dateError, 'Добавь хотя бы одну дату');
        elements.dateInput?.focus();
        return false;
      }

      clearFieldError(elements.dateInput, elements.dateError);
      return true;
    }

    if (!validateRequiredField(values.periodStart, elements.periodStartInput, elements.dateError, 'Укажи дату начала')) {
      return false;
    }

    if (!validateRequiredField(values.periodEnd, elements.periodEndInput, elements.dateError, 'Укажи дату окончания')) {
      return false;
    }

    if (values.periodEnd < values.periodStart) {
      showFieldError(elements.periodEndInput, elements.dateError, 'Дата окончания не может быть раньше даты начала');
      elements.periodEndInput?.focus();
      return false;
    }

    clearFieldError(elements.periodEndInput, elements.dateError);
    return true;
  };

  return {
    bind: () => {
      syncScheduleMode();
      syncAnytimeState();
      elements.dateInput?.addEventListener('input', handleDateChange);
      elements.startTimeInput?.addEventListener('input', handleStartTimeChange);
      elements.endTimeInput?.addEventListener('input', handleEndTimeChange);
      elements.periodStartInput?.addEventListener('input', handlePeriodStartChange);
      elements.periodEndInput?.addEventListener('input', handlePeriodEndChange);
      elements.anytimeInput?.addEventListener('change', syncAnytimeState);
      elements.scheduleModeInputs.forEach((input) => input?.addEventListener('change', handleScheduleModeChange));
      elements.addDateButton?.addEventListener('click', handleAddDate);
      elements.multipleDatesList?.addEventListener('click', handleMultipleDatesClick);
      elements.multipleDatesList?.addEventListener('input', handleMultipleDatesChange);
    },
    unbind: () => {
      elements.dateInput?.removeEventListener('input', handleDateChange);
      elements.startTimeInput?.removeEventListener('input', handleStartTimeChange);
      elements.endTimeInput?.removeEventListener('input', handleEndTimeChange);
      elements.periodStartInput?.removeEventListener('input', handlePeriodStartChange);
      elements.periodEndInput?.removeEventListener('input', handlePeriodEndChange);
      elements.anytimeInput?.removeEventListener('change', syncAnytimeState);
      elements.scheduleModeInputs.forEach((input) => input?.removeEventListener('change', handleScheduleModeChange));
      elements.addDateButton?.removeEventListener('click', handleAddDate);
      elements.multipleDatesList?.removeEventListener('click', handleMultipleDatesClick);
      elements.multipleDatesList?.removeEventListener('input', handleMultipleDatesChange);
    },
    validate,
  };
}
