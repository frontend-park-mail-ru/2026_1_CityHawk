import { getPlaces } from '../../api/places.api.js';
import { getCategories } from '../../api/categories.api.js';

function mapPlacesToOptions(items) {
  return Array.isArray(items)
    ? items.map((place) => ({
      value: String(place?.id || ''),
      label: [place?.name, place?.addressLine].filter(Boolean).join(' · ') || 'Без названия',
    }))
    : [];
}

function mapCategoriesToOptions(items) {
  return Array.isArray(items)
    ? items.map((category) => ({
      value: String(category?.id || ''),
      label: String(category?.name || 'Без названия'),
    }))
    : [];
}

/**
 * Загружает справочники мест и категорий для формы события.
 *
 * @returns {Promise<{
 *   places: Array<{ value: string, label: string }>,
 *   categories: Array<{ value: string, label: string }>
 * }>}
 */
export async function loadEventFormReferenceData() {
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
