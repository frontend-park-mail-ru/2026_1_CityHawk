import { YANDEX_MAPS_API_KEY } from '../../../api/config.js';
import { renderTemplate } from '../../../app/templates/renderer.js';

interface YMapEntityLike {
  addChild?: (entity: unknown) => YMapEntityLike;
}

interface YMapLike extends YMapEntityLike {
  destroy: () => void;
}

interface YMaps3Global {
  ready: Promise<void>;
  YMap: new (element: HTMLElement, props: Record<string, unknown>) => YMapLike;
  YMapDefaultSchemeLayer: new (props?: Record<string, unknown>) => YMapEntityLike;
  YMapDefaultFeaturesLayer: new (props?: Record<string, unknown>) => YMapEntityLike;
  YMapMarker: new (props: Record<string, unknown>, element?: HTMLElement) => YMapEntityLike;
}

declare global {
  interface Window {
    ymaps3?: YMaps3Global;
  }
}

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

export interface EventLocationState {
  paragraphs?: string[];
  mapImageUrl?: string;
  mapAlt?: string;
  mapLatitude?: number;
  mapLongitude?: number;
  mapTitle?: string;
}

export function renderEventLocation(state: EventLocationState = {}): string {
  const latitude = Number(state.mapLatitude);
  const longitude = Number(state.mapLongitude);
  const hasMapCoordinates = Number.isFinite(latitude) && Number.isFinite(longitude);

  return renderTemplate('event-location', {
    ...state,
    hasMapCoordinates,
    mapLatitude: hasMapCoordinates ? latitude : '',
    mapLongitude: hasMapCoordinates ? longitude : '',
    mapTitle: state.mapTitle || 'Локация события',
  });
}

export function attachEventLocation(root: ParentNode): () => void {
  const mapBlock = root.querySelector('[data-role="event-location-map"]');
  const mapCanvas = root.querySelector('[data-role="event-location-map-canvas"]');

  const handleMapClick = (): void => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  };

  let map: YMapLike | null = null;
  let disposed = false;

  if (
    mapBlock instanceof HTMLElement
    && mapCanvas instanceof HTMLElement
    && mapBlock.dataset.latitude
    && mapBlock.dataset.longitude
  ) {
    const latitude = Number(mapBlock.dataset.latitude);
    const longitude = Number(mapBlock.dataset.longitude);

    if (Number.isFinite(latitude) && Number.isFinite(longitude)) {
      void loadYandexMapsApiV3(YANDEX_MAPS_API_KEY).then(async (ymaps3) => {
        if (disposed || !ymaps3) {
          return;
        }

        await ymaps3.ready;
        if (disposed) {
          return;
        }

        map = new ymaps3.YMap(mapCanvas, {
          location: {
            center: [longitude, latitude],
            zoom: 14,
          },
          behaviors: ['drag', 'pinchZoom', 'scrollZoom'],
          controls: [],
          mode: 'vector',
          theme: 'dark',
        });

        map
          .addChild?.(new ymaps3.YMapDefaultSchemeLayer({ theme: 'dark' }))
          .addChild?.(new ymaps3.YMapDefaultFeaturesLayer({}));

        const markerElement = document.createElement('div');
        markerElement.className = 'event-location__marker';
        const marker = new ymaps3.YMapMarker(
          {
            coordinates: [longitude, latitude],
            zIndex: 120,
          },
          markerElement,
        );

        map.addChild?.(marker);
      });
    }
  } else if (mapBlock instanceof HTMLElement) {
    mapBlock.addEventListener('click', handleMapClick);
  }

  return () => {
    disposed = true;

    if (map) {
      map.destroy();
      map = null;
    }

    if (mapBlock instanceof HTMLElement) {
      mapBlock.removeEventListener('click', handleMapClick);
    }
  };
}
