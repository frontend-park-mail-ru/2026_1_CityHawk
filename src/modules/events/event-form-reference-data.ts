import { getPlaces } from '../../api/places.api.js';
import { getCategories } from '../../api/categories.api.js';
import { getTags } from '../../api/tags.api.js';
import { localizeCategoryName } from './category-localization.js';
import type { Category, Place, Tag } from '../../types/api.js';

export interface EventFormSelectOption {
  value: string;
  label: string;
  selected?: boolean;
}

function mapPlacesToOptions(items: Place[] | undefined): EventFormSelectOption[] {
  return Array.isArray(items)
    ? items.map((place) => ({
      value: String(place?.id || ''),
      label: [place?.name, place?.addressLine].filter(Boolean).join(' · ') || 'Без названия',
    }))
    : [];
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
  const [placesResult, categoriesResult, tagsResult] = await Promise.allSettled([
    getPlaces(),
    getCategories(),
    getTags(),
  ]);

  return {
    places: placesResult.status === 'fulfilled'
      ? mapPlacesToOptions(placesResult.value?.items)
      : [],
    categories: categoriesResult.status === 'fulfilled'
      ? mapCategoriesToOptions(categoriesResult.value?.items)
      : [],
    tags: tagsResult.status === 'fulfilled'
      ? mapTagsToOptions(tagsResult.value?.items)
      : [],
  };
}
