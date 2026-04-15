import { searchAll } from '../../api/search.api.js';

interface HeaderSearchSuggestionsOptions {
  onPick?: (query: string) => void;
  minQueryLength?: number;
  debounceMs?: number;
  maxItems?: number;
}

function escapeHTML(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function normalizeSuggestions(payload: unknown): string[] {
  if (!payload || typeof payload !== 'object') {
    return [];
  }

  const source = payload as {
    items?: unknown;
  };

  return Array.isArray(source.items)
    ? source.items
      .map((item) => String(item || '').trim())
      .filter(Boolean)
    : [];
}

export function attachHeaderSearchSuggestions(
  form: HTMLFormElement,
  options: HeaderSearchSuggestionsOptions = {},
): () => void {
  const input = form.querySelector('input[name="query"]');
  const host = form.closest('[data-role="header-search-wrap"]');
  const panel = host?.querySelector('[data-role="header-search-suggestions"]');

  if (!(input instanceof HTMLInputElement) || !(panel instanceof HTMLElement)) {
    return () => {};
  }

  const minQueryLength = options.minQueryLength ?? 2;
  const debounceMs = options.debounceMs ?? 250;
  const maxItems = options.maxItems ?? 8;

  let timer: number | undefined;
  let requestID = 0;

  const hide = () => {
    panel.hidden = true;
    panel.innerHTML = '';
  };

  const show = (items: string[]) => {
    if (!items.length) {
      hide();
      return;
    }

    panel.innerHTML = items
      .slice(0, maxItems)
      .map((item, index) => (`
        <button
          type="button"
          class="site-header__search-suggestion"
          data-role="header-search-suggestion"
          data-query="${escapeHTML(item)}"
          data-index="${index}"
        >${escapeHTML(item)}</button>
      `))
      .join('');
    panel.hidden = false;
  };

  const loadSuggestions = async (rawQuery: string): Promise<void> => {
    const query = rawQuery.trim();
    if (query.length < minQueryLength) {
      hide();
      return;
    }

    const current = ++requestID;

    try {
      const result = await searchAll(query);
      if (current != requestID) {
        return;
      }
      const items = normalizeSuggestions(result);
      show(items);
    } catch {
      if (current == requestID) {
        hide();
      }
    }
  };

  const scheduleLoad = () => {
    if (timer !== undefined) {
      window.clearTimeout(timer);
    }

    timer = window.setTimeout(() => {
      void loadSuggestions(input.value);
    }, debounceMs);
  };

  const onInput = () => {
    scheduleLoad();
  };

  const onFocus = () => {
    if (input.value.trim().length >= minQueryLength) {
      scheduleLoad();
    }
  };

  const onPanelClick = (event: Event) => {
    const target = event.target;
    if (!(target instanceof HTMLElement)) {
      return;
    }

    const button = target.closest('[data-role="header-search-suggestion"]');
    if (!(button instanceof HTMLButtonElement)) {
      return;
    }

    const query = String(button.dataset.query || '').trim();
    if (!query) {
      return;
    }

    input.value = query;
    hide();
    options.onPick?.(query);
  };

  const onDocumentClick = (event: Event) => {
    const target = event.target;
    if (!(target instanceof Node)) {
      return;
    }

    if (!host.contains(target)) {
      hide();
    }
  };

  const onKeyDown = (event: KeyboardEvent) => {
    if (event.key === 'Escape') {
      hide();
    }
  };

  input.setAttribute('autocomplete', 'off');
  input.addEventListener('input', onInput);
  input.addEventListener('focus', onFocus);
  input.addEventListener('keydown', onKeyDown);
  panel.addEventListener('click', onPanelClick);
  document.addEventListener('click', onDocumentClick);

  return () => {
    if (timer !== undefined) {
      window.clearTimeout(timer);
    }
    input.removeEventListener('input', onInput);
    input.removeEventListener('focus', onFocus);
    input.removeEventListener('keydown', onKeyDown);
    panel.removeEventListener('click', onPanelClick);
    document.removeEventListener('click', onDocumentClick);
    hide();
  };
}
