import { renderTemplate } from '../../../app/templates/renderer.js';

export interface EventDescriptionState {
  leadText?: string;
  paragraphs?: string[];
  hasExtraParagraphs?: boolean;
}

export function renderEventDescription(state: EventDescriptionState = {}): string {
  return renderTemplate('event-description', state);
}

export function attachEventDescription(root: ParentNode): void {
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
