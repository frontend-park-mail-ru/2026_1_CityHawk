import { getPlaces } from '../../api/places.api.js';
import { getCategories } from '../../api/categories.api.js';
import type { Category, Place } from '../../types/api.js';

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
      label: String(category?.name || 'Без названия'),
    }))
    : [];
}

export interface EventFormReferenceData {
  places: EventFormSelectOption[];
  categories: EventFormSelectOption[];
}

export async function loadEventFormReferenceData(): Promise<EventFormReferenceData> {
  const [placesResult, categoriesResult] = await Promise.allSettled([
    getPlaces(),
    getCategories(),
  ]);

  return {
    places: placesResult.status === 'fulfilled'
      ? mapPlacesToOptions(placesResult.value?.items)
      : [],
    categories: categoriesResult.status === 'fulfilled'
      ? mapCategoriesToOptions(categoriesResult.value?.items)
      : [],
  };
}
