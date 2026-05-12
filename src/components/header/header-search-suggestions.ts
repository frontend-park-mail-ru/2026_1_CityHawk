import { searchAll } from '../../api/search.api.js';
import type { SearchSuggestionItem } from '../../api/search.api.js';

export interface HeaderSearchSuggestion {
  id: string;
  type: string;
  label: string;
}

interface HeaderSearchSuggestionsOptions {
  onPick?: (query: string, suggestion: HeaderSearchSuggestion) => void;
  minQueryLength?: number;
  debounceMs?: number;
  maxItems?: number;
}

function normalizeSuggestionType(value: unknown): string {
  return String(value || '').trim().toLowerCase();
}

const SUGGESTION_META_LABELS: Record<string, string> = {
  category: 'Категория',
  'категория': 'Категория',
  tag: 'Тег',
  'тег': 'Тег',
  event: 'Событие',
  'событие': 'Событие',
  user: 'Пользователь',
  'пользователь': 'Пользователь',
};

function isHeaderSearchSuggestion(item: HeaderSearchSuggestion | null): item is HeaderSearchSuggestion {
  return item !== null;
}

function normalizeSuggestions(payload: unknown): HeaderSearchSuggestion[] {
  if (!payload || typeof payload !== 'object') {
    return [];
  }

  const source = payload as {
    items?: unknown;
  };

  return Array.isArray(source.items)
    ? source.items
      .map((item, index) => {
        if (typeof item === 'string') {
          const label = item.trim();
          if (!label) {
            return null;
          }

          return {
            id: '',
            type: 'query',
            label,
          } as HeaderSearchSuggestion;
        }

        if (!item || typeof item !== 'object') {
          return null;
        }

        const typedItem = item as SearchSuggestionItem;
        const label = String(
          typedItem.label
          || typedItem.title
          || typedItem.name
          || typedItem.query
          || '',
        ).trim();

        if (!label) {
          return null;
        }

        return {
          id: String(typedItem.id || '').trim(),
          type: normalizeSuggestionType(typedItem.type || 'query') || 'query',
          label,
        } satisfies HeaderSearchSuggestion;
      })
      .filter(isHeaderSearchSuggestion)
    : [];
}

function getSuggestionMetaLabel(type: string): string {
  const normalizedType = normalizeSuggestionType(type);
  return SUGGESTION_META_LABELS[normalizedType] || '';
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

  const show = (items: HeaderSearchSuggestion[]) => {
    if (!items.length) {
      hide();
      return;
    }

    panel.innerHTML = '';

    items
      .slice(0, maxItems)
      .forEach((item, index) => {
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'site-header__search-suggestion';
        button.dataset.role = 'header-search-suggestion';
        button.dataset.id = item.id;
        button.dataset.type = item.type;
        button.dataset.label = item.label;
        button.dataset.index = String(index);
        const title = document.createElement('span');
        title.className = 'site-header__search-suggestion-title';
        title.textContent = item.label;

        const metaText = getSuggestionMetaLabel(item.type);
        if (metaText) {
          const meta = document.createElement('span');
          meta.className = 'site-header__search-suggestion-meta';
          meta.textContent = metaText;
          button.append(title, meta);
        } else {
          button.append(title);
        }
        panel.append(button);
      });

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

    const label = String(button.dataset.label || '').trim();
    const suggestion: HeaderSearchSuggestion = {
      id: String(button.dataset.id || '').trim(),
      type: normalizeSuggestionType(button.dataset.type || 'query') || 'query',
      label,
    };

    if (!suggestion.label) {
      return;
    }

    input.value = suggestion.label;
    hide();
    options.onPick?.(suggestion.label, suggestion);
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
