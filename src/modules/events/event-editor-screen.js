import { renderTemplate } from '../../app/templates/renderer.js';
import { attachEventForm } from './event-form.js';

export function renderEventEditorScreen(state = {}) {
  return renderTemplate('event-editor-screen', state);
}

export function attachEventEditorScreen(root, options = {}) {
  const headerSearchForm = root.querySelector('[data-role="header-search-form"]');

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

  headerSearchForm?.addEventListener('submit', handleHeaderSearchSubmit);

  const detachEventForm = attachEventForm(root, {
    onSubmit: options.onSubmit,
    onCancel: options.onCancel,
  });

  return () => {
    headerSearchForm?.removeEventListener('submit', handleHeaderSearchSubmit);
    detachEventForm();
  };
}
