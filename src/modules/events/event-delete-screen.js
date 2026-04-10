import { renderTemplate } from '../../app/templates/renderer.js';

export function renderEventDeleteScreen(state = {}) {
  return renderTemplate('event-delete-screen', state);
}

export function attachEventDeleteScreen(root, options = {}) {
  const headerSearchForm = root.querySelector('[data-role="header-search-form"]');
  const confirmButton = root.querySelector('[data-action="event-delete-confirm"]');

  const handleHeaderSearchSubmit = (event) => {
    event.preventDefault();

    const formData = new FormData(headerSearchForm);
    const query = String(formData.get('query') || '').trim();
    const params = new URLSearchParams();

    if (query) {
      params.set('query', query);
    }

    const suffix = params.toString() ? `?${params.toString()}` : '';
    options.navigate?.(`/events${suffix}`);
  };

  const handleDeleteConfirm = async () => {
    await options.onConfirm?.();
  };

  headerSearchForm?.addEventListener('submit', handleHeaderSearchSubmit);
  confirmButton?.addEventListener('click', handleDeleteConfirm);

  return () => {
    headerSearchForm?.removeEventListener('submit', handleHeaderSearchSubmit);
    confirmButton?.removeEventListener('click', handleDeleteConfirm);
  };
}
