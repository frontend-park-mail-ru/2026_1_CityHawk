import { renderTemplate } from '../../app/templates/renderer.js';
import { attachHeaderSearchSuggestions } from '../../components/header/header-search-suggestions.js';

export interface HeroSearchState {
  query?: string;
}

export interface HeroSearchOptions {
  onSearch?: (query: string) => void;
}

export function renderHeroSearch(state: HeroSearchState = {}): string {
  return renderTemplate('hero-search', {
    query: state.query || '',
  });
}

export function attachHeroSearch(root: ParentNode, options: HeroSearchOptions = {}): () => void {
  const form = root.querySelector('[data-role="hero-search-form"]');
  if (!(form instanceof HTMLFormElement)) {
    return () => {};
  }

  const handleSubmit = (event: SubmitEvent) => {
    event.preventDefault();

    const formData = new FormData(form);
    const query = String(formData.get('query') || '').trim();

    if (typeof options.onSearch === 'function') {
      options.onSearch(query);
    }
  };

  form.addEventListener('submit', handleSubmit);
  const detachSuggestions = attachHeaderSearchSuggestions(form, {
    onPick(query) {
      options.onSearch?.(query);
    },
  });

  return () => {
    detachSuggestions();
    form.removeEventListener('submit', handleSubmit);
  };
}
