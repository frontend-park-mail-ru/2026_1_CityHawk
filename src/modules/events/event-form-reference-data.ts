import { getCategories } from '../../api/categories.api.js';
import { getTags } from '../../api/tags.api.js';
import { localizeCategoryName } from './category-localization.js';
import type { Category, Tag } from '../../types/api.js';

export interface EventFormSelectOption {
  value: string;
  label: string;
  selected?: boolean;
}

function mapCategoriesToOptions(items: Category[] | undefined): EventFormSelectOption[] {
  return Array.isArray(items)
    ? items.map((category) => ({
      value: String(category?.id || ''),
      label: localizeCategoryName(category),
    }))
    : [];
}

function mapTagsToOptions(items: Tag[] | undefined): EventFormSelectOption[] {
  return Array.isArray(items)
    ? items.map((tag) => ({
      value: String(tag?.id || ''),
      label: String(tag?.name || '').trim() || 'Без названия',
    }))
    : [];
}

export interface EventFormReferenceData {
  places: EventFormSelectOption[];
  categories: EventFormSelectOption[];
  tags: EventFormSelectOption[];
}

export async function loadEventFormReferenceData(): Promise<EventFormReferenceData> {
  const [categoriesResult, tagsResult] = await Promise.allSettled([
    getCategories(),
    getTags(),
  ]);

  return {
    places: [],
    categories: categoriesResult.status === 'fulfilled'
      ? mapCategoriesToOptions(categoriesResult.value?.items)
      : [],
    tags: tagsResult.status === 'fulfilled'
      ? mapTagsToOptions(tagsResult.value?.items)
      : [],
  };
}
