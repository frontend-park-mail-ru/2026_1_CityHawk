export interface EventFormElements {
  form: HTMLFormElement | null;
  cancelButton: HTMLButtonElement | null;
  titleInput: HTMLInputElement | null;
  titleError: HTMLElement | null;
  dateInput: HTMLInputElement | null;
  startTimeInput: HTMLInputElement | null;
  endTimeInput: HTMLInputElement | null;
  dateError: HTMLElement | null;
  scheduleModeInputs: HTMLInputElement[];
  schedulePanels: HTMLElement[];
  multipleDatesList: HTMLElement | null;
  addDateButton: HTMLButtonElement | null;
  periodStartInput: HTMLInputElement | null;
  periodEndInput: HTMLInputElement | null;
  anytimeInput: HTMLInputElement | null;
  placeInput: HTMLSelectElement | null;
  placeError: HTMLElement | null;
  categoryInput: HTMLSelectElement | null;
  categoryError: HTMLElement | null;
  descriptionInput: HTMLTextAreaElement | null;
  descriptionError: HTMLElement | null;
  locationDescriptionInput: HTMLTextAreaElement | null;
  locationDescriptionError: HTMLElement | null;
  posterTrigger: HTMLElement | null;
  posterInput: HTMLInputElement | null;
  posterRemoveButton: HTMLButtonElement | null;
  galleryTriggers: HTMLElement[];
  galleryInputs: HTMLInputElement[];
  galleryRemoveButtons: HTMLButtonElement[];
}

export function getEventFormElements(root: ParentNode): EventFormElements {
  return {
    form: root.querySelector<HTMLFormElement>('[data-role="event-create-form"]'),
    cancelButton: root.querySelector<HTMLButtonElement>('[data-action="event-create-cancel"]'),
    titleInput: root.querySelector<HTMLInputElement>('[data-role="event-create-title"]'),
    titleError: root.querySelector<HTMLElement>('[data-role="event-create-title-error"]'),
    dateInput: root.querySelector<HTMLInputElement>('[data-role="event-create-date"]'),
    startTimeInput: root.querySelector<HTMLInputElement>('[data-role="event-create-start-time"]'),
    endTimeInput: root.querySelector<HTMLInputElement>('[data-role="event-create-end-time"]'),
    dateError: root.querySelector<HTMLElement>('[data-role="event-create-date-error"]'),
    scheduleModeInputs: Array.from(root.querySelectorAll<HTMLInputElement>('[data-role="event-create-schedule-mode"]')),
    schedulePanels: Array.from(root.querySelectorAll<HTMLElement>('[data-role="event-create-schedule-panel"]')),
    multipleDatesList: root.querySelector<HTMLElement>('[data-role="event-create-multiple-dates-list"]'),
    addDateButton: root.querySelector<HTMLButtonElement>('[data-action="event-create-add-date"]'),
    periodStartInput: root.querySelector<HTMLInputElement>('[data-role="event-create-period-start"]'),
    periodEndInput: root.querySelector<HTMLInputElement>('[data-role="event-create-period-end"]'),
    anytimeInput: root.querySelector<HTMLInputElement>('[data-role="event-create-anytime"]'),
    placeInput: root.querySelector<HTMLSelectElement>('[data-role="event-create-place"]'),
    placeError: root.querySelector<HTMLElement>('[data-role="event-create-place-error"]'),
    categoryInput: root.querySelector<HTMLSelectElement>('[data-role="event-create-category"]'),
    categoryError: root.querySelector<HTMLElement>('[data-role="event-create-category-error"]'),
    descriptionInput: root.querySelector<HTMLTextAreaElement>('[data-role="event-create-description"]'),
    descriptionError: root.querySelector<HTMLElement>('[data-role="event-create-description-error"]'),
    locationDescriptionInput: root.querySelector<HTMLTextAreaElement>('[data-role="event-create-location-description"]'),
    locationDescriptionError: root.querySelector<HTMLElement>('[data-role="event-create-location-description-error"]'),
    posterTrigger: root.querySelector<HTMLElement>('[data-role="event-create-poster-trigger"]'),
    posterInput: root.querySelector<HTMLInputElement>('[data-role="event-create-poster-input"]'),
    posterRemoveButton: root.querySelector<HTMLButtonElement>('[data-role="event-create-poster-remove"]'),
    galleryTriggers: Array.from(root.querySelectorAll<HTMLElement>('[data-role="event-create-gallery-trigger"]')),
    galleryInputs: Array.from(root.querySelectorAll<HTMLInputElement>('[data-role="event-create-gallery-input"]')),
    galleryRemoveButtons: Array.from(root.querySelectorAll<HTMLButtonElement>('[data-role="event-create-gallery-remove"]')),
  };
}
