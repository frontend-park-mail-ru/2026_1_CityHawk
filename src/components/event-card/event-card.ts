import { renderTemplate } from '../../app/templates/renderer.js';

export interface EventCardRenderState {
  id?: string | number;
  imageUrl?: string;
  title?: string;
  textLines?: string[];
  tags?: string[];
  hideTags?: boolean;
  cardClass?: string;
  isFavorite?: boolean;
  invitedBy?: {
    username?: string;
    displayName?: string;
    avatarUrl?: string | null;
  } | null;
}

function getInitials(value: string): string {
  return String(value || '')
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || '')
    .join('')
    || 'CH';
}

export function renderEventCard(state: EventCardRenderState = {}): string {
  const tags = Array.isArray(state.tags) ? state.tags : [];
  const primaryTag = tags[0] || '';
  const extraTagsCount = Math.max(0, tags.length - 1);
  const isMovieCard = tags.some((tag) => tag.trim().toLowerCase() === 'кино');
  const cardClass = [
    state.cardClass || '',
    isMovieCard ? 'event-card--poster' : '',
  ].filter(Boolean).join(' ');
  const inviterName = String(state.invitedBy?.displayName || state.invitedBy?.username || '').trim();
  const invitedBy = inviterName
    ? {
      name: inviterName,
      avatarUrl: String(state.invitedBy?.avatarUrl || '').trim(),
      initials: getInitials(inviterName),
    }
    : null;

  return renderTemplate('event-card', {
    id: state.id ?? '',
    imageUrl: state.imageUrl || '',
    title: state.title || '',
    textLines: Array.isArray(state.textLines) ? state.textLines.filter(Boolean) : [],
    tags,
    hideTags: Boolean(state.hideTags),
    primaryTag,
    extraTagsCount,
    cardClass,
    isFavorite: Boolean(state.isFavorite),
    invitedBy,
  });
}
