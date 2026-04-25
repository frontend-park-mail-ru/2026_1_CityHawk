import type { Category } from '../../../types/api.js';

const CATEGORY_RU_BY_SLUG: Record<string, string> = {
  concert: 'Концерт',
  concerts: 'Концерты',
  exhibition: 'Выставка',
  exhibitions: 'Выставки',
  theatre: 'Театр',
  theater: 'Театр',
  show: 'Шоу',
  comedy: 'Комедия',
  education: 'Образование',
  entertainment: 'Развлечения',
  standup: 'Стендап',
  festival: 'Фестиваль',
  lecture: 'Лекция',
  workshop: 'Мастер-класс',
  cinema: 'Кино',
  movie: 'Кино',
  sport: 'Спорт',
  party: 'Вечеринка',
  kids: 'Для детей',
};

const CATEGORY_RU_BY_NAME: Record<string, string> = {
  concert: 'Концерт',
  concerts: 'Концерты',
  exhibition: 'Выставка',
  exhibitions: 'Выставки',
  theatre: 'Театр',
  theater: 'Театр',
  show: 'Шоу',
  comedy: 'Комедия',
  education: 'Образование',
  entertainment: 'Развлечения',
  'stand up': 'Стендап',
  standup: 'Стендап',
  festival: 'Фестиваль',
  lecture: 'Лекция',
  workshop: 'Мастер-класс',
  movie: 'Кино',
  cinema: 'Кино',
  sport: 'Спорт',
  party: 'Вечеринка',
  kids: 'Для детей',
};

function normalize(value: string): string {
  return value.trim().toLowerCase();
}

export function localizeCategoryName(category?: Partial<Category> | null): string {
  const slug = normalize(String(category?.slug || ''));
  if (slug && CATEGORY_RU_BY_SLUG[slug]) {
    return CATEGORY_RU_BY_SLUG[slug];
  }

  const name = String(category?.name || '').trim();
  const normalizedName = normalize(name);

  if (normalizedName && CATEGORY_RU_BY_NAME[normalizedName]) {
    return CATEGORY_RU_BY_NAME[normalizedName];
  }

  return name || 'Без названия';
}
