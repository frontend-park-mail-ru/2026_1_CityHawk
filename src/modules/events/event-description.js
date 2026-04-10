import { renderTemplate } from '../../app/templates/renderer.js';

/**
 * Рендерит описание мероприятия.
 *
 * @param {Record<string, any>} state
 * @returns {string}
 */
export function renderEventDescription(state = {}) {
  return renderTemplate('event-description', state);
}

/**
 * Подключает сворачивание длинного описания.
 *
 * @param {ParentNode} root
 * @returns {void}
 */
export function attachEventDescription(root) {
  const section = root.querySelector('[data-role="event-description"]');
  const button = root.querySelector('[data-action="event-description-toggle"]');

  if (!(section instanceof HTMLElement) || !(button instanceof HTMLButtonElement)) {
    return;
  }

  button.addEventListener('click', () => {
    const isExpanded = section.dataset.expanded === 'true';
    section.dataset.expanded = String(!isExpanded);
    button.textContent = isExpanded ? 'показать ещё...' : 'скрыть';
  });
}
