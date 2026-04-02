import { renderTemplate } from '../../app/templates/renderer.js';

/**
 * Рендерит hero-блок с поиском.
 *
 * @param {{ query?: string }} [state]
 * @returns {string}
 */
export function renderHeroSearch(state = {}) {
  return renderTemplate('hero-search', {
    query: state.query || '',
  });
}

/**
 * Подключает обработчик поиска в hero-блоке.
 *
 * @param {ParentNode} root
 * @param {{ onSearch?: (query: string) => void }} [options]
 * @returns {void}
 */
export function attachHeroSearch(root, options = {}) {
  const form = root.querySelector('[data-role="hero-search-form"]');
  if (!(form instanceof HTMLFormElement)) {
    return;
  }

  form.addEventListener('submit', (event) => {
    event.preventDefault();

    const formData = new FormData(form);
    const query = String(formData.get('query') || '').trim();

    if (typeof options.onSearch === 'function') {
      options.onSearch(query);
    }
  });
}
