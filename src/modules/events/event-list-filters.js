import { renderTemplate } from '../../app/templates/renderer.js';

export function renderEventListFilters(state = {}) {
  return renderTemplate('event-list-filters', {
    categories: Array.isArray(state.categories) ? state.categories : [],
    datePresetOptions: Array.isArray(state.datePresetOptions) ? state.datePresetOptions : [],
    sortOptions: Array.isArray(state.sortOptions) ? state.sortOptions : [],
  });
}

export function attachEventListFilters(root, options = {}) {
  const form = root.querySelector('[data-role="event-list-filter-form"]');

  const handleSubmit = (event) => {
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
