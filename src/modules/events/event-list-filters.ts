import { renderTemplate } from '../../app/templates/renderer.js';

export interface SelectOption {
  value: string;
  label: string;
  selected?: boolean;
}

export interface EventListFiltersState {
  categories?: SelectOption[];
  tags?: SelectOption[];
  datePresetOptions?: SelectOption[];
  sortOptions?: SelectOption[];
}

export interface EventListFiltersOptions {
  onSubmit?: (form: HTMLFormElement) => void;
}

export function renderEventListFilters(state: EventListFiltersState = {}): string {
  const categories = Array.isArray(state.categories) ? state.categories : [];
  const tags = Array.isArray(state.tags) ? state.tags : [];
  const datePresetOptions = Array.isArray(state.datePresetOptions) ? state.datePresetOptions : [];
  const sortOptions = Array.isArray(state.sortOptions) ? state.sortOptions : [];

  return renderTemplate('event-list-filters', {
    categories,
    tags,
    datePresetOptions,
    sortOptions,
    hasCategories: categories.length > 0,
    hasTags: tags.length > 0,
    hasDatePresetOptions: datePresetOptions.length > 0,
    hasSortOptions: sortOptions.length > 0,
    hasAnyFilters: categories.length > 0 || tags.length > 0 || datePresetOptions.length > 0 || sortOptions.length > 0,
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
