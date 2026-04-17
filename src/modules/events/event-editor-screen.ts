import { renderTemplate } from '../../app/templates/renderer.js';
import { attachEventForm } from './event-form.js';
import type { EventFormSubmitPayload } from './event-form.js';
import type { User } from '../../types/api.js';
import { attachHeaderSearchSuggestions } from '../../components/header/header-search-suggestions.js';
import { attachHeaderCityPicker } from '../../components/header/header-city-picker.js';

type HeaderSearchState = {
  query?: string;
};

type HeaderUser = User & {
  displayName?: string;
};

export interface EventEditorScreenState {
  eyebrow?: string;
  title?: string;
  eventForm?: string;
  user?: HeaderUser | null;
  headerSearch?: HeaderSearchState;
}

export interface EventEditorScreenOptions {
  navigate?: (path: string) => void;
  onSubmit?: (payload: EventFormSubmitPayload, form: HTMLFormElement, event: SubmitEvent) => void;
  onCancel?: () => void;
}

export function renderEventEditorScreen(state: EventEditorScreenState = {}): string {
  return renderTemplate('event-editor-screen', state);
}

export function attachEventEditorScreen(
  root: ParentNode,
  options: EventEditorScreenOptions = {},
): () => void {
  const headerSearchForm = root.querySelector('[data-role="header-search-form"]');
  const detachCityPicker = attachHeaderCityPicker(root, {
    navigate: options.navigate,
    targetPath: '/events',
  });

  const navigateByHeaderQuery = (query: string) => {
    const params = new URLSearchParams();

    if (query) {
      params.set('query', query);
    }

    const suffix = params.toString() ? `?${params.toString()}` : '';
    options.navigate?.(`/events${suffix}`);
  };

  const handleHeaderSearchSubmit = (event: SubmitEvent) => {
    event.preventDefault();

    if (!(headerSearchForm instanceof HTMLFormElement)) {
      return;
    }

    const formData = new FormData(headerSearchForm);
    const query = String(formData.get('query') || '').trim();
    navigateByHeaderQuery(query);
  };

  let detachHeaderSuggestions = () => {};
  if (headerSearchForm instanceof HTMLFormElement) {
    headerSearchForm.addEventListener('submit', handleHeaderSearchSubmit);
    detachHeaderSuggestions = attachHeaderSearchSuggestions(headerSearchForm, {
      onPick(query) {
        navigateByHeaderQuery(query);
      },
    });
  }

  const detachEventForm = attachEventForm(root, {
    onSubmit: options.onSubmit,
    onCancel: options.onCancel,
  });

  return () => {
    detachCityPicker();
    detachHeaderSuggestions();

    if (headerSearchForm instanceof HTMLFormElement) {
      headerSearchForm.removeEventListener('submit', handleHeaderSearchSubmit);
    }

    detachEventForm();
  };
}
