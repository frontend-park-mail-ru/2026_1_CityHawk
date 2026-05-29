import type { ApiError } from '../types/api.js';

function hasCyrillic(value: string): boolean {
  return /[А-Яа-яЁё]/.test(value);
}

export function translateApiErrorMessage(message: string, status?: number): string {
  const raw = String(message || '').trim();
  const lower = raw.toLowerCase();

  if (!raw && status) {
    return translateApiErrorMessage(`HTTP ${status}`, status);
  }

  if (hasCyrillic(raw)) {
    return raw;
  }

  if (lower.includes('image file is too large') || lower.includes('file is too large') || lower.includes('too large')) {
    return 'Загрузите изображение до 5 МБ';
  }

  if (lower.includes('unsupported') && lower.includes('image')) {
    return 'Загрузите PNG, JPEG, GIF или WebP';
  }

  if (lower.includes('invalid') && lower.includes('image')) {
    return 'Загрузите PNG, JPEG, GIF или WebP';
  }

  if (lower.includes('validation failed')) {
    return 'Проверьте данные';
  }

  if (lower.includes('unauthorized') || lower.includes('missing access token')) {
    return 'Войдите в аккаунт';
  }

  if (lower.includes('forbidden') || lower.includes('csrf') || lower.includes('invalid origin')) {
    return 'Недостаточно прав для действия';
  }

  if (lower.includes('not found')) {
    return 'Ничего не найдено';
  }

  if (lower.includes('already')) {
    return 'Запись уже существует';
  }

  if (lower.includes('offline') || lower.includes('failed to fetch') || lower.includes('network')) {
    return 'Проверьте соединение';
  }

  if (/^http\s+400\b/i.test(raw)) {
    return 'Проверьте данные';
  }

  if (/^http\s+401\b/i.test(raw)) {
    return 'Войдите в аккаунт';
  }

  if (/^http\s+403\b/i.test(raw)) {
    return 'Недостаточно прав для действия';
  }

  if (/^http\s+404\b/i.test(raw)) {
    return 'Ничего не найдено';
  }

  if (/^http\s+409\b/i.test(raw)) {
    return 'Конфликт данных';
  }

  if (/^http\s+413\b/i.test(raw)) {
    return 'Загрузите изображение до 5 МБ';
  }

  if (/^http\s+5\d\d\b/i.test(raw)) {
    return 'Сервер временно недоступен';
  }

  return raw || 'Что-то пошло не так';
}

export function getApiErrorDetail(error: ApiError | undefined, field?: string): string {
  const details = error?.details || {};

  if (field) {
    return String(details[field] || '').trim();
  }

  return String(Object.values(details).find((value) => typeof value === 'string' && value) || '').trim();
}

export function getUserErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof Error) {
    const apiError = error as ApiError;
    const detail = getApiErrorDetail(apiError);
    return translateApiErrorMessage(detail || error.message, apiError.status);
  }

  return fallback;
}
