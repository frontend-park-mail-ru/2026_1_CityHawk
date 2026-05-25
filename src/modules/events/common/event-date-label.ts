function formatPointDate(value?: string | null): string {
  if (!value) {
    return '';
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return String(value);
  }

  return new Intl.DateTimeFormat('ru-RU', {
    day: 'numeric',
    month: 'long',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

function formatPeriodDate(startAt?: string | null, endAt?: string | null): string {
  if (!startAt || !endAt) {
    return '';
  }

  const start = new Date(startAt);
  const end = new Date(endAt);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    return '';
  }

  const sameYear = start.getFullYear() === end.getFullYear();
  const sameMonth = sameYear && start.getMonth() === end.getMonth();
  const sameDay = sameMonth && start.getDate() === end.getDate();
  if (sameDay) {
    return '';
  }

  const monthGenitive = [
    'января',
    'февраля',
    'марта',
    'апреля',
    'мая',
    'июня',
    'июля',
    'августа',
    'сентября',
    'октября',
    'ноября',
    'декабря',
  ];
  const shortFormatter = new Intl.DateTimeFormat('ru-RU', { day: 'numeric', month: 'long' });

  if (sameMonth) {
    return `${start.getDate()}-${end.getDate()} ${monthGenitive[start.getMonth()]}`;
  }

  return `${shortFormatter.format(start)} - ${shortFormatter.format(end)}`;
}

export function formatEventDateOrPeriod(source: unknown): string {
  if (!source || typeof source !== 'object') {
    return '';
  }

  const item = source as Record<string, unknown>;
  const nextSession = item.nextSession as Record<string, unknown> | undefined;
  const sessions = Array.isArray(item.sessions) ? item.sessions : [];
  const firstSession = sessions[0] as Record<string, unknown> | undefined;

  const startAt = String(
    nextSession?.startAt
    || firstSession?.startAt
    || item.startAt
    || '',
  ).trim();
  const endAt = String(
    nextSession?.endAt
    || firstSession?.endAt
    || item.endAt
    || '',
  ).trim();

  const period = formatPeriodDate(startAt, endAt);
  if (period) {
    return period;
  }

  const point = formatPointDate(startAt);
  return point;
}
