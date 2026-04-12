import { renderTemplate } from '../../app/templates/renderer.js';

export interface SelectOption {
  value: string;
  label: string;
  selected?: boolean;
}

export interface EventListFiltersState {
  categories?: SelectOption[];
  datePresetOptions?: SelectOption[];
  sortOptions?: SelectOption[];
}

export interface EventListFiltersOptions {
  onSubmit?: (form: HTMLFormElement) => void;
}

export function renderEventListFilters(state: EventListFiltersState = {}): string {
  return renderTemplate('event-list-filters', {
    categories: Array.isArray(state.categories) ? state.categories : [],
    datePresetOptions: Array.isArray(state.datePresetOptions) ? state.datePresetOptions : [],
    sortOptions: Array.isArray(state.sortOptions) ? state.sortOptions : [],
  });
}

export function attachEventListFilters(
  root: ParentNode,
  options: EventListFiltersOptions = {},
): () => void {
  const form = root.querySelector('[data-role="event-list-filter-form"]');

  const handleSubmit = (event: SubmitEvent) => {
    event.preventDefault();

    if (form instanceof HTMLFormElement && typeof options.onSubmit === 'function') {
      options.onSubmit(form);
    }
  };

  if (form instanceof HTMLFormElement) {
    form.addEventListener('submit', handleSubmit);
  }

  return () => {
    if (form instanceof HTMLFormElement) {
      form.removeEventListener('submit', handleSubmit);
    }
  };
}
