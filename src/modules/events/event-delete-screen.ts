import { renderTemplate } from '../../app/templates/renderer.js';
import type { User } from '../../types/api.js';

type HeaderSearchState = {
  query?: string;
};

type HeaderUser = User & {
  displayName?: string;
};

export interface EventDeleteScreenState {
  eventDeleteCard?: string;
  user?: HeaderUser | null;
  headerSearch?: HeaderSearchState;
}

export interface EventDeleteScreenOptions {
  navigate?: (path: string) => void;
  onConfirm?: () => Promise<void> | void;
}

export function renderEventDeleteScreen(state: EventDeleteScreenState = {}): string {
  return renderTemplate('event-delete-screen', state);
}

export function attachEventDeleteScreen(
  root: ParentNode,
  options: EventDeleteScreenOptions = {},
): () => void {
  const headerSearchForm = root.querySelector('[data-role="header-search-form"]');
  const confirmButton = root.querySelector('[data-action="event-delete-confirm"]');

  const handleHeaderSearchSubmit = (event: SubmitEvent) => {
    event.preventDefault();

    if (!(headerSearchForm instanceof HTMLFormElement)) {
      return;
    }

    const formData = new FormData(headerSearchForm);
    const query = String(formData.get('query') || '').trim();
    const params = new URLSearchParams();

    if (query) {
      params.set('query', query);
    }

    const suffix = params.toString() ? `?${params.toString()}` : '';
    options.navigate?.(`/events${suffix}`);
  };

  const handleDeleteConfirm = async (): Promise<void> => {
    await options.onConfirm?.();
  };

  if (headerSearchForm instanceof HTMLFormElement) {
    headerSearchForm.addEventListener('submit', handleHeaderSearchSubmit);
  }

  if (confirmButton instanceof HTMLButtonElement) {
    confirmButton.addEventListener('click', handleDeleteConfirm);
  }

  return () => {
    if (headerSearchForm instanceof HTMLFormElement) {
      headerSearchForm.removeEventListener('submit', handleHeaderSearchSubmit);
    }

    if (confirmButton instanceof HTMLButtonElement) {
      confirmButton.removeEventListener('click', handleDeleteConfirm);
    }
  };
}
