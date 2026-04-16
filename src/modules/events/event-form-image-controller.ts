export interface ImageFieldControllerOptions {
  trigger: Element | null;
  input: Element | null;
  removeButton: Element | null;
  initialPreviewUrl?: string;
}

export interface ImageFieldController {
  bind: () => void;
  unbind: () => void;
  clear: () => void;
  getFile: () => File | null;
  getPreviewUrl: () => string;
}

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.addEventListener('load', () => {
      if (typeof reader.result === 'string' && reader.result) {
        resolve(reader.result);
        return;
      }

      reject(new Error(`Не удалось прочитать файл ${file.name}`));
    });

    reader.addEventListener('error', () => {
      reject(new Error(`Не удалось прочитать файл ${file.name}`));
    });

    reader.readAsDataURL(file);
  });
}

export async function buildImageUrls(
  posterController: ImageFieldController,
  galleryControllers: ImageFieldController[],
): Promise<string[]> {
  const posterFile = posterController.getFile();
  const uploadedPoster = posterFile ? [await fileToDataUrl(posterFile)] : [];
  const galleryFiles = galleryControllers
    .map((controller) => controller.getFile())
    .filter((file): file is File => Boolean(file));
  const uploadedGallery = await Promise.all(
    galleryFiles.map((file) => fileToDataUrl(file)),
  );
  const fallbackPreviewUrls = [
    posterController.getPreviewUrl(),
    ...galleryControllers.map((controller) => controller.getPreviewUrl()),
  ].filter((url) => typeof url === 'string' && url.trim() && !url.startsWith('blob:'));

  const imageUrls = uploadedPoster.length > 0 || uploadedGallery.length > 0
    ? [...uploadedPoster, ...uploadedGallery]
    : fallbackPreviewUrls;

  return Array.from(new Set(imageUrls)).slice(0, 5);
}

export function createImageFieldController({
  trigger,
  input,
  removeButton,
  initialPreviewUrl = '',
}: ImageFieldControllerOptions): ImageFieldController {
  let file: File | null = null;
  let objectPreviewUrl = '';
  let currentPreviewUrl = String(initialPreviewUrl || '').trim();

  const applyPreview = (nextPreviewUrl: string): void => {
    if (trigger instanceof HTMLElement) {
      trigger.style.backgroundImage = nextPreviewUrl ? `url("${nextPreviewUrl}")` : '';
      trigger.style.backgroundSize = nextPreviewUrl ? 'cover' : '';
      trigger.style.backgroundPosition = nextPreviewUrl ? 'center' : '';
      trigger.classList.toggle('event-create-upload--has-image', Boolean(nextPreviewUrl));
    }

    if (removeButton instanceof HTMLButtonElement) {
      removeButton.hidden = !nextPreviewUrl;
    }
  };

  const clear = (): void => {
    file = null;

    if (input instanceof HTMLInputElement) {
      input.value = '';
    }

    if (objectPreviewUrl) {
      URL.revokeObjectURL(objectPreviewUrl);
      objectPreviewUrl = '';
    }

    currentPreviewUrl = '';
    applyPreview('');
  };

  const handleTriggerClick = (): void => {
    if (input instanceof HTMLInputElement) {
      input.click();
    }
  };

  const handleInputChange = (): void => {
    if (!(input instanceof HTMLInputElement)) {
      return;
    }

    const nextFile = input.files?.[0];
    if (!nextFile) {
      return;
    }

    file = nextFile;

    if (objectPreviewUrl) {
      URL.revokeObjectURL(objectPreviewUrl);
    }

    objectPreviewUrl = URL.createObjectURL(nextFile);
    currentPreviewUrl = objectPreviewUrl;
    applyPreview(currentPreviewUrl);
  };

  const handleRemoveClick = (event: Event): void => {
    event.preventDefault();
    event.stopPropagation();
    clear();
  };

  const bind = (): void => {
    applyPreview(currentPreviewUrl);
    trigger?.addEventListener('click', handleTriggerClick);
    input?.addEventListener('change', handleInputChange);
    removeButton?.addEventListener('click', handleRemoveClick);
  };

  const unbind = (): void => {
    trigger?.removeEventListener('click', handleTriggerClick);
    input?.removeEventListener('change', handleInputChange);
    removeButton?.removeEventListener('click', handleRemoveClick);

    if (objectPreviewUrl) {
      URL.revokeObjectURL(objectPreviewUrl);
      objectPreviewUrl = '';
    }
  };

  return {
    bind,
    unbind,
    clear,
    getFile: () => file,
    getPreviewUrl: () => currentPreviewUrl,
  };
}
