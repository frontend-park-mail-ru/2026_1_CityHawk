import { YANDEX_MAPS_API_KEY } from '../../api/config.js';
import { renderTemplate } from '../../app/templates/renderer.js';

type MapFilterName = 'district' | 'style' | 'season' | 'sort';

export interface EventsMapFilterOption {
  value: string;
  label: string;
  selected: boolean;
}

export interface EventsMapPin {
  id: string;
  title: string;
  address: string;
  imageUrl: string;
  latitude: number;
  longitude: number;
  active: boolean;
}

export interface EventsMapCanvasState {
  districtOptions: EventsMapFilterOption[];
  styleOptions: EventsMapFilterOption[];
  seasonOptions: EventsMapFilterOption[];
  sortOptions: EventsMapFilterOption[];
  hasPins: boolean;
}

export interface EventsMapCanvasAttachOptions {
  pins: EventsMapPin[];
  onFilterChange?: (name: MapFilterName, value: string) => void;
  onPinPick?: (pinId: string) => void;
}

interface YMapEntityLike {
  addChild?: (entity: unknown) => YMapEntityLike;
  update?: (props: Record<string, unknown>) => void;
}

interface YMapLike extends YMapEntityLike {
  destroy: () => void;
}

interface YMapMarkerLike extends YMapEntityLike {
  update?: (props: Record<string, unknown>) => void;
}

interface YMaps3Global {
  ready: Promise<void>;
  YMap: new (element: HTMLElement, props: Record<string, unknown>) => YMapLike;
  YMapDefaultSchemeLayer: new (props?: Record<string, unknown>) => YMapEntityLike;
  YMapDefaultFeaturesLayer: new (props?: Record<string, unknown>) => YMapEntityLike;
  YMapMarker: new (props: Record<string, unknown>, element?: HTMLElement) => YMapMarkerLike;
}

declare global {
  interface Window {
    ymaps3?: YMaps3Global;
  }
}

const MOSCOW_CENTER: [number, number] = [37.618423, 55.751244];
const MAP_BEHAVIORS = ['drag', 'pinchZoom', 'scrollZoom'];
let yandexMapsLoadPromise: Promise<YMaps3Global | null> | null = null;

function loadYandexMapsApiV3(apiKey: string): Promise<YMaps3Global | null> {
  if (!apiKey) {
    return Promise.resolve(null);
  }

  if (window.ymaps3) {
    return Promise.resolve(window.ymaps3);
  }

  if (yandexMapsLoadPromise) {
    return yandexMapsLoadPromise;
  }

  yandexMapsLoadPromise = new Promise((resolve) => {
    const script = document.createElement('script');
    script.src = `https://api-maps.yandex.ru/v3/?apikey=${encodeURIComponent(apiKey)}&lang=ru_RU`;
    script.async = true;
    script.onload = () => resolve(window.ymaps3 || null);
    script.onerror = () => resolve(null);
    document.head.append(script);
  });

  return yandexMapsLoadPromise;
}

function createMarkerElement(pin: EventsMapPin): HTMLElement {
  const marker = document.createElement('div');
  marker.className = `events-map-canvas__marker ${pin.active ? 'events-map-canvas__marker--active' : ''}`;
  marker.innerHTML = `<img src="${pin.imageUrl}" alt="${pin.title}" class="events-map-canvas__marker-image" />`;
  return marker;
}

function attachYandexMap(
  host: HTMLElement,
  pins: EventsMapPin[],
  onPinPick?: (pinId: string) => void,
): () => void {
  const canvas = host.querySelector('[data-role="events-map-canvas-root"]');
  if (!(canvas instanceof HTMLElement) || pins.length === 0) {
    return () => {};
  }

  let disposed = false;
  let map: YMapLike | null = null;
  const markerListeners: Array<() => void> = [];
  let activeMarkerElement: HTMLElement | null = null;

  const showFallback = (message: string) => {
    if (disposed) {
      return;
    }
    canvas.innerHTML = `<div class="events-map-canvas__empty"><h2 class="events-map-canvas__empty-title">Карта недоступна</h2><p class="events-map-canvas__empty-text">${message}</p></div>`;
  };

  void loadYandexMapsApiV3(YANDEX_MAPS_API_KEY).then(async (ymaps3) => {
    if (disposed) {
      return;
    }

    if (!ymaps3) {
      showFallback('Добавь YANDEX_MAPS_API_KEY в runtime-config.js или переменные окружения сервера.');
      return;
    }

    await ymaps3.ready;
    if (disposed) {
      return;
    }

    map = new ymaps3.YMap(canvas, {
      location: {
        center: MOSCOW_CENTER,
        zoom: 11,
      },
      behaviors: MAP_BEHAVIORS,
      controls: [],
      mode: 'vector',
      theme: 'dark',
    });

    map
      .addChild?.(new ymaps3.YMapDefaultSchemeLayer({
        theme: 'dark',
        customization: [
          {
            tags: {
              all: ['road'],
            },
            elements: 'geometry',
            stylers: [
              {
                saturation: -0.25,
              },
              {
                lightness: -0.12,
              },
            ],
          },
          {
            tags: {
              all: ['landscape', 'park'],
            },
            elements: 'geometry',
            stylers: [
              {
                saturation: -0.18,
              },
              {
                lightness: -0.16,
              },
            ],
          },
          {
            tags: {
              all: ['water'],
            },
            elements: 'geometry',
            stylers: [
              {
                saturation: -0.3,
              },
              {
                lightness: -0.22,
              },
            ],
          },
          {
            tags: {
              all: ['label'],
            },
            elements: 'label',
            stylers: [
              {
                saturation: -0.2,
              },
              {
                lightness: 0.08,
              },
            ],
          },
          {
            tags: {
              any: ['poi'],
            },
            elements: 'label',
            stylers: [
              {
                opacity: 0.35,
              },
            ],
          },
        ],
      }))
      .addChild?.(new ymaps3.YMapDefaultFeaturesLayer({}));

    pins.forEach((pin) => {
      const markerElement = createMarkerElement(pin);
      if (pin.active) {
        activeMarkerElement = markerElement;
      }
      const marker = new ymaps3.YMapMarker(
        {
          coordinates: [pin.longitude, pin.latitude],
          zIndex: pin.active ? 200 : 100,
        },
        markerElement,
      );

      const handleClick = () => {
        if (activeMarkerElement && activeMarkerElement !== markerElement) {
          activeMarkerElement.classList.remove('events-map-canvas__marker--active');
        }

        markerElement.classList.add('events-map-canvas__marker--active');
        activeMarkerElement = markerElement;
        onPinPick?.(pin.id);
      };
      markerElement.addEventListener('click', handleClick);
      markerListeners.push(() => markerElement.removeEventListener('click', handleClick));

      map?.addChild?.(marker);
    });
  });

  return () => {
    disposed = true;
    markerListeners.forEach((detach) => detach());
    if (map) {
      map.destroy();
      map = null;
    }
  };
}

export function renderEventsMapCanvas(state: EventsMapCanvasState): string {
  return renderTemplate('events-map-canvas', state);
}

export function attachEventsMapCanvas(
  root: ParentNode,
  options: EventsMapCanvasAttachOptions,
): () => void {
  const host = root.querySelector('[data-role="events-map-canvas"]');
  if (!(host instanceof HTMLElement)) {
    return () => {};
  }

  const detachCustomSelects = attachMapCustomDropdowns(host);
  const selects = Array.from(host.querySelectorAll<HTMLSelectElement>('select.events-map-canvas__input'));
  const handleFilterChange = (event: Event) => {
    const target = event.target;
    if (!(target instanceof HTMLSelectElement)) {
      return;
    }

    const name = String(target.name || '').trim() as MapFilterName;
    if (!['district', 'style', 'season', 'sort'].includes(name)) {
      return;
    }

    options.onFilterChange?.(name, String(target.value || '').trim());
  };

  selects.forEach((select) => {
    select.addEventListener('change', handleFilterChange);
  });

  const detachMap = attachYandexMap(host, options.pins, options.onPinPick);

  return () => {
    detachCustomSelects();
    detachMap();
    selects.forEach((select) => {
      select.removeEventListener('change', handleFilterChange);
    });
  };
}

function attachMapCustomDropdowns(host: HTMLElement): () => void {
  const selects = Array.from(host.querySelectorAll<HTMLSelectElement>('select.events-map-canvas__input'));
  const detachList: Array<() => void> = [];
  let openMenu: HTMLElement | null = null;

  const closeOpenMenu = () => {
    if (!openMenu) {
      return;
    }

    const trigger = openMenu.closest('.events-map-canvas__custom-select')
      ?.querySelector<HTMLButtonElement>('.events-map-canvas__custom-trigger');
    openMenu.hidden = true;
    trigger?.setAttribute('aria-expanded', 'false');
    openMenu = null;
  };

  selects.forEach((select) => {
    const field = select.closest('.events-map-canvas__filter');
    if (!(field instanceof HTMLElement)) {
      return;
    }

    const optionItems = Array.from(select.options).map((option) => ({
      value: option.value,
      label: option.textContent || '',
    }));

    const custom = document.createElement('div');
    custom.className = 'events-map-canvas__custom-select';

    const trigger = document.createElement('button');
    trigger.type = 'button';
    trigger.className = 'events-map-canvas__custom-trigger';
    trigger.setAttribute('aria-haspopup', 'listbox');
    trigger.setAttribute('aria-expanded', 'false');

    const menu = document.createElement('div');
    menu.className = 'events-map-canvas__custom-menu';
    menu.setAttribute('role', 'listbox');
    menu.hidden = true;

    optionItems.forEach((item) => {
      const optionButton = document.createElement('button');
      optionButton.type = 'button';
      optionButton.className = 'events-map-canvas__custom-option';
      optionButton.dataset.value = item.value;
      optionButton.textContent = item.label;
      menu.append(optionButton);
    });

    custom.append(trigger, menu);
    field.append(custom);
    select.classList.add('events-map-canvas__input--hidden');

    const sync = () => {
      const selectedOption = select.selectedOptions.item(0);
      trigger.textContent = selectedOption?.textContent || optionItems[0]?.label || '';
      trigger.classList.toggle('events-map-canvas__custom-trigger--active', select.value !== '');

      Array.from(menu.querySelectorAll<HTMLButtonElement>('.events-map-canvas__custom-option'))
        .forEach((button) => {
          const isActive = button.dataset.value === select.value;
          button.classList.toggle('events-map-canvas__custom-option--active', isActive);
          button.setAttribute('aria-selected', isActive ? 'true' : 'false');
        });
    };

    sync();

    const handleTriggerClick = () => {
      if (openMenu && openMenu !== menu) {
        closeOpenMenu();
      }

      if (menu.hidden) {
        menu.hidden = false;
        trigger.setAttribute('aria-expanded', 'true');
        openMenu = menu;
      } else {
        closeOpenMenu();
      }
    };

    const handleMenuClick = (event: Event) => {
      const target = event.target;
      if (!(target instanceof HTMLElement)) {
        return;
      }

      const optionButton = target.closest<HTMLButtonElement>('.events-map-canvas__custom-option');
      if (!(optionButton instanceof HTMLButtonElement)) {
        return;
      }

      const value = String(optionButton.dataset.value || '');
      if (select.value !== value) {
        select.value = value;
        select.dispatchEvent(new Event('change', { bubbles: true }));
      }
      sync();
      closeOpenMenu();
    };

    const handleDocumentClick = (event: Event) => {
      const target = event.target;
      if (!(target instanceof Node)) {
        return;
      }

      if (!custom.contains(target) && openMenu === menu) {
        closeOpenMenu();
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && openMenu === menu) {
        closeOpenMenu();
      }
    };

    const handleSelectChange = () => {
      sync();
    };

    trigger.addEventListener('click', handleTriggerClick);
    menu.addEventListener('click', handleMenuClick);
    document.addEventListener('click', handleDocumentClick);
    document.addEventListener('keydown', handleKeyDown);
    select.addEventListener('change', handleSelectChange);

    detachList.push(() => {
      trigger.removeEventListener('click', handleTriggerClick);
      menu.removeEventListener('click', handleMenuClick);
      document.removeEventListener('click', handleDocumentClick);
      document.removeEventListener('keydown', handleKeyDown);
      select.removeEventListener('change', handleSelectChange);
      select.classList.remove('events-map-canvas__input--hidden');
      custom.remove();
      if (openMenu === menu) {
        openMenu = null;
      }
    });
  });

  return () => {
    closeOpenMenu();
    detachList.forEach((detach) => detach());
  };
}
