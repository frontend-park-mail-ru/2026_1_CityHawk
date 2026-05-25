import './organizer-apply.css';
import { renderTemplate } from '../../app/templates/renderer.js';
import { attachHeaderCityPicker } from '../../components/header/header-city-picker.js';
import { attachHeaderSearchSuggestions } from '../../components/header/header-search-suggestions.js';
import { getHeaderUserDisplayName } from '../../components/header/header-user.js';
import { getMeOrNull } from '../../api/profile.api.js';
import { createOrganizerApplication } from '../../api/organizer.api.js';
import { showToast } from '../../app/ui/toast.js';
import { getUserErrorMessage } from '../../api/errors.js';
import { renderEventEditorScreen } from '../../modules/events/form/event-editor-screen.js';
import '../../modules/events/form/event-editor-screen.css';
import type { User } from '../../types/api.js';
import type { RouteContext, RouteView } from '../../types/router.js';

export async function organizerApplyPage({ navigate }: RouteContext): Promise<RouteView> {
  const me = await getMeOrNull().catch(() => null);
  const user: (User & { displayName: string }) | null = me
    ? { ...me, displayName: getHeaderUserDisplayName(me) }
    : null;

  const organizerApplyForm = renderTemplate('organizer-apply');
  const html = renderEventEditorScreen({
    eyebrow: 'Партнерство',
    title: 'Станьте организатором CityHawk',
    eventForm: organizerApplyForm,
    user,
    headerSearch: { query: '' },
  });

  return {
    html,
    mount(root) {
      const headerSearchForm = root.querySelector('[data-role="header-search-form"]');
      const form = root.querySelector<HTMLFormElement>('[data-role="organizer-apply-form"]');
      const success = root.querySelector<HTMLElement>('[data-role="organizer-apply-success"]');
      const detachCityPicker = attachHeaderCityPicker(root, { navigate, targetPath: '/events' });

      const navigateByHeaderQuery = (nextQuery: string): void => {
        const params = new URLSearchParams();
        if (nextQuery.trim()) {
          params.set('query', nextQuery.trim());
        }
        const suffix = params.toString() ? `?${params.toString()}` : '';
        navigate(`/events${suffix}`);
      };

      const handleHeaderSearchSubmit = (event: SubmitEvent): void => {
        event.preventDefault();
        if (!(headerSearchForm instanceof HTMLFormElement)) {
          return;
        }
        const formData = new FormData(headerSearchForm);
        const query = String(formData.get('query') || '').trim();
        navigateByHeaderQuery(query);
      };

      let isSubmitting = false;
      const handleSubmit = async (event: SubmitEvent): Promise<void> => {
        event.preventDefault();
        if (!(form instanceof HTMLFormElement)) {
          return;
        }
        if (isSubmitting) {
          return;
        }

        if (!form.checkValidity()) {
          form.reportValidity();
          return;
        }

        const submitButton = form.querySelector<HTMLButtonElement>('button[type="submit"]');
        const initialSubmitText = submitButton?.textContent || 'Отправить заявку';
        const formData = new FormData(form);
        const payload = {
          name: String(formData.get('name') || '').trim(),
          email: String(formData.get('email') || '').trim(),
          phone: String(formData.get('phone') || '').trim(),
          city: String(formData.get('city') || '').trim(),
          projectName: String(formData.get('projectName') || '').trim(),
          categories: String(formData.get('categories') || '').trim(),
          links: String(formData.get('links') || '').trim(),
          about: String(formData.get('about') || '').trim(),
          consent: formData.get('consent') === 'on',
        };

        isSubmitting = true;
        if (submitButton instanceof HTMLButtonElement) {
          submitButton.disabled = true;
          submitButton.textContent = 'Отправляем...';
        }

        try {
          await createOrganizerApplication(payload);
        } catch (error) {
          showToast(getUserErrorMessage(error, 'Не удалось отправить заявку'), { type: 'error' });
          if (submitButton instanceof HTMLButtonElement) {
            submitButton.disabled = false;
            submitButton.textContent = initialSubmitText;
          }
          isSubmitting = false;
          return;
        }

        form.hidden = true;
        if (success instanceof HTMLElement) {
          success.hidden = false;
          success.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
        isSubmitting = false;
      };

      let detachHeaderSuggestions = () => {};
      if (headerSearchForm instanceof HTMLFormElement) {
        headerSearchForm.addEventListener('submit', handleHeaderSearchSubmit);
        detachHeaderSuggestions = attachHeaderSearchSuggestions(headerSearchForm, {
          onPick(query) {
            navigateByHeaderQuery(query);
          },
        });
      }

      if (form instanceof HTMLFormElement) {
        form.addEventListener('submit', handleSubmit);
      }

      return () => {
        detachCityPicker();
        detachHeaderSuggestions();
        if (headerSearchForm instanceof HTMLFormElement) {
          headerSearchForm.removeEventListener('submit', handleHeaderSearchSubmit);
        }
        if (form instanceof HTMLFormElement) {
          form.removeEventListener('submit', handleSubmit);
        }
      };
    },
  };
}
