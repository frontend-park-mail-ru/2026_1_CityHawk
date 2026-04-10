import { renderTemplate } from '../../app/templates/renderer.js';

export function renderEventDeleteCard(state = {}) {
  return renderTemplate('event-delete-card', state);
}
