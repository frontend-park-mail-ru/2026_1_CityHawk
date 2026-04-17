import { getCities } from '../../api/cities.api.js';
import type { City } from '../../types/api.js';

interface HeaderCityPickerOptions {
  navigate?: (path: string) => void;
  targetPath?: string;
}

let cachedCities: City[] | null = null;
let cachedCitiesPromise: Promise<City[]> | null = null;

function isUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

async function loadCities(): Promise<City[]> {
  if (cachedCities) {
    return cachedCities;
  }

  if (cachedCitiesPromise) {
    return cachedCitiesPromise;
  }

  cachedCitiesPromise = getCities()
    .then((response) => {
      const items = Array.isArray(response?.items)
        ? response.items
          .filter((city) => city && typeof city === 'object')
          .map((city) => ({
            id: String(city.id || '').trim(),
            name: String(city.name || '').trim(),
            countryName: String(city.countryName || '').trim(),
            timezone: String(city.timezone || '').trim(),
          }))
          .filter((city) => city.id && city.name)
        : [];

      cachedCities = items;
      return items;
    })
    .catch(() => [])
    .finally(() => {
      cachedCitiesPromise = null;
    });

  return cachedCitiesPromise;
}

function getInitialCityState(): { cityId: string; cityName: string } {
  const params = new URLSearchParams(window.location.search);
  const cityId = String(params.get('cityId') || '').trim();
  const cityName = String(params.get('city') || '').trim();

  return {
    cityId,
    cityName,
  };
}

export function attachHeaderCityPicker(
  root: ParentNode,
  options: HeaderCityPickerOptions = {},
): () => void {
  const host = root.querySelector('[data-role="header-city"]');
  const trigger = root.querySelector('[data-role="header-city-trigger"]');
  const label = root.querySelector('[data-role="header-city-label"]');
  const menu = root.querySelector('[data-role="header-city-menu"]');
  const optionsRoot = root.querySelector('[data-role="header-city-options"]');

  if (!(host instanceof HTMLElement)
    || !(trigger instanceof HTMLButtonElement)
    || !(label instanceof HTMLElement)
    || !(menu instanceof HTMLElement)
    || !(optionsRoot instanceof HTMLElement)) {
    return () => {};
  }

  let disposed = false;
  let isOpen = false;
  let loaded = false;
  let selected = getInitialCityState();

  const setLabel = () => {
    label.textContent = selected.cityName || 'Все города';
  };

  const closeMenu = () => {
    if (!isOpen) {
      return;
    }

    isOpen = false;
    menu.hidden = true;
    trigger.setAttribute('aria-expanded', 'false');
  };

  const openMenu = () => {
    isOpen = true;
    menu.hidden = false;
    trigger.setAttribute('aria-expanded', 'true');
  };

  const buildOptionHTML = (city: City): string => `
    <button
      type="button"
      class="site-header__city-option"
      data-role="header-city-option"
      data-city-id="${city.id}"
      data-city-name="${city.name}"
    >${city.name}</button>
  `;

  const markSelectedOption = () => {
    const cityButtons = Array.from(menu.querySelectorAll<HTMLButtonElement>('[data-role="header-city-option"]'));
    cityButtons.forEach((button) => {
      const buttonCityId = String(button.dataset.cityId || '').trim();
      const isSelected = selected.cityId
        ? buttonCityId === selected.cityId
        : buttonCityId === '';

      button.classList.toggle('site-header__city-option--active', isSelected);
      button.setAttribute('aria-selected', isSelected ? 'true' : 'false');
    });
  };

  const ensureOptionsLoaded = async () => {
    if (loaded) {
      markSelectedOption();
      return;
    }

    const cities = await loadCities();
    if (disposed) {
      return;
    }

    optionsRoot.innerHTML = cities.map(buildOptionHTML).join('');
    loaded = true;

    if (!selected.cityName && selected.cityId) {
      const matchedCity = cities.find((city) => city.id === selected.cityId);
      if (matchedCity) {
        selected = {
          cityId: matchedCity.id,
          cityName: matchedCity.name,
        };
        setLabel();
      }
    }

    markSelectedOption();
  };

  const navigateWithCity = (cityId: string, cityName: string) => {
    const params = new URLSearchParams(window.location.search);

    if (cityId) {
      params.set('cityId', cityId);
    } else {
      params.delete('cityId');
    }

    if (cityName) {
      params.set('city', cityName);
    } else {
      params.delete('city');
    }

    const targetPath = options.targetPath || window.location.pathname;
    const suffix = params.toString() ? `?${params.toString()}` : '';
    const nextPath = `${targetPath}${suffix}`;

    if (typeof options.navigate === 'function') {
      options.navigate(nextPath);
      return;
    }

    window.location.assign(nextPath);
  };

  const onTriggerClick = () => {
    if (isOpen) {
      closeMenu();
      return;
    }

    openMenu();
    void ensureOptionsLoaded();
  };

  const onMenuClick = (event: Event) => {
    const target = event.target;
    if (!(target instanceof HTMLElement)) {
      return;
    }

    const button = target.closest('[data-role="header-city-option"]');
    if (!(button instanceof HTMLButtonElement)) {
      return;
    }

    const cityId = String(button.dataset.cityId || '').trim();
    const cityName = String(button.dataset.cityName || '').trim();

    selected = {
      cityId,
      cityName,
    };
    setLabel();
    markSelectedOption();
    closeMenu();
    navigateWithCity(selected.cityId, selected.cityName);
  };

  const onDocumentClick = (event: Event) => {
    const target = event.target;
    if (!(target instanceof Node)) {
      return;
    }

    if (!host.contains(target)) {
      closeMenu();
    }
  };

  const onKeyDown = (event: KeyboardEvent) => {
    if (event.key === 'Escape') {
      closeMenu();
    }
  };

  setLabel();
  trigger.addEventListener('click', onTriggerClick);
  menu.addEventListener('click', onMenuClick);
  document.addEventListener('click', onDocumentClick);
  document.addEventListener('keydown', onKeyDown);

  return () => {
    disposed = true;
    closeMenu();
    trigger.removeEventListener('click', onTriggerClick);
    menu.removeEventListener('click', onMenuClick);
    document.removeEventListener('click', onDocumentClick);
    document.removeEventListener('keydown', onKeyDown);
  };
}
