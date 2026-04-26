import type { SupportCategory, SupportStatus } from '../../types/api.js';

export const SUPPORT_CATEGORIES: Record<SupportCategory, string> = {
  bug: 'Баг',
  suggestion: 'Предложение',
  product_complaint: 'Продуктовая жалоба',
  other: 'Другое',
};

export const SUPPORT_STATUSES: Record<SupportStatus, string> = {
  open: 'Открыто',
  in_progress: 'В работе',
  closed: 'Закрыто',
};

export const SUPPORT_CATEGORY_OPTIONS = Object.entries(SUPPORT_CATEGORIES).map(([value, label]) => ({
  value: value as SupportCategory,
  label,
}));

export const SUPPORT_STATUS_OPTIONS = Object.entries(SUPPORT_STATUSES).map(([value, label]) => ({
  value: value as SupportStatus,
  label,
}));
