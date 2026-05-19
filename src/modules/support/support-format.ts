import { SUPPORT_CATEGORIES, SUPPORT_STATUSES } from './support.constants.js';
import type { SupportCategory, SupportStatus } from '../../types/api.js';

export function formatSupportCategory(value?: string | null): string {
  return SUPPORT_CATEGORIES[value as SupportCategory] || 'Другое';
}

export function formatSupportStatus(value?: string | null): string {
  return SUPPORT_STATUSES[value as SupportStatus] || 'Открыто';
}

export function formatSupportDate(value?: string | null): string {
  if (!value) {
    return '';
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return String(value);
  }

  return new Intl.DateTimeFormat('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

export function getSupportErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof Error && error.message) {
    return error.message;
  }

  return fallback;
}
