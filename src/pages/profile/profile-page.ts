import { getMeOrNull, updateProfile, updateProfileMultipart } from '../../api/profile.api.js';
import { getCities } from '../../api/cities.api.js';
import { logout } from '../../api/auth.api.js';
import './profile.css';
import '../../modules/profile/profile-aside.css';
import '../../modules/profile/profile-form.css';
import { getHeaderUserDisplayName } from '../../components/header/header-user.js';
import { renderTemplate } from '../../app/templates/renderer.js';
import { showToast } from '../../app/ui/toast.js';
import { isValidEmail } from '../../modules/auth/shared/validators.js';
import type { UpdateProfilePayload } from '../../types/api.js';
import type { RouteContext, RouteView } from '../../types/router.js';

function getUserInitials(name?: string): string {
  const parts = String(name || '')
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2);

  if (parts.length === 0) {
    return 'CH';
  }

  return parts.map((part) => part[0]?.toUpperCase() || '').join('');
}

export async function profilePage({ navigate }: RouteContext): Promise<RouteView> {
  const [meResult, citiesResult] = await Promise.allSettled([
    getMeOrNull(),
    getCities(),
  ]);
  const me = meResult.status === 'fulfilled' ? meResult.value : null;
  const cityItems = citiesResult.status === 'fulfilled' && Array.isArray(citiesResult.value?.items)
    ? citiesResult.value.items
    : [];
  const cityOptions = cityItems.map((city) => ({
    value: String(city?.id || ''),
    label: String(city?.name || '').trim() || 'Без названия',
    selected: String(city?.id || '') === String(me?.city?.id || ''),
  })).filter((option) => option.value);

  const hasSelectedCity = cityOptions.some((option) => option.selected);
  if (!hasSelectedCity && me?.city?.id) {
    cityOptions.unshift({
      value: String(me.city.id),
      label: String(me.city.name || '').trim() || 'Выберите город',
      selected: true,
    });
  }

  if (!cityOptions.length) {
    cityOptions.push({
      value: '',
      label: me?.city?.name || 'Выберите город',
      selected: true,
    });
  }

  const displayName = getHeaderUserDisplayName(me) || 'Имя';
  const user = {
    name: displayName,
    firstName: me?.username || '',
    lastName: me?.userSurname || '',
    email: me?.email || 'address@service.com',
    birthdate: me?.birthday || '',
    cityId: me?.city?.id || '',
    cityName: me?.city?.name || '',
    cityOptions,
    initials: getUserInitials(displayName),
    avatarUrl: me?.avatarUrl || '',
  };

  const html = renderTemplate('profile', { user });

  return {
    html,
    mount(root) {
      const logoutButton = root.querySelector('.profile__logout-link');
      const profileForm = root.querySelector('.profile__form');
      const avatarEditButton = root.querySelector('.profile__avatar-edit');
      const avatarInput = root.querySelector('[data-role="profile-avatar-input"]');
      const emailInput = root.querySelector('#email');
      const emailError = root.querySelector('.profile__email-error');

      const setEmailError = (message = ''): void => {
        const text = String(message || '').trim();

        if (emailError instanceof HTMLElement) {
          emailError.textContent = text;
        }

        const emailField = emailInput instanceof HTMLInputElement
          ? emailInput.closest('.profile__field--email')
          : null;

        if (emailField instanceof HTMLElement) {
          emailField.classList.toggle('profile__field--error', Boolean(text));
        }
      };

      const handleLogout = async () => {
        await logout().catch(() => {});
        navigate('/login', { replace: true });
      };

      const handleProfileSubmit = async (event: Event) => {
        event.preventDefault();

        if (!(profileForm instanceof HTMLFormElement)) {
          return;
        }

        const formData = new FormData(profileForm);
        const email = String(formData.get('email') || '').trim();

        if (!email || !isValidEmail(email)) {
          setEmailError('Укажите корректный email в формате address@service.com');
          return;
        }
        setEmailError('');

        const payload: UpdateProfilePayload = {
          email,
          username: String(formData.get('firstName') || '').trim(),
          userSurname: String(formData.get('lastName') || '').trim(),
          birthday: String(formData.get('birthdate') || '').trim(),
          cityId: String(formData.get('city') || '').trim(),
        };

        Object.keys(payload).forEach((key) => {
          const typedKey = key as keyof UpdateProfilePayload;
          if (!payload[typedKey]) {
            delete payload[typedKey];
          }
        });

        try {
          await updateProfile(payload);
          navigate('/profile', { replace: true });
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Не удалось обновить профиль';
          if (String(message).toLowerCase().includes('email')) {
            setEmailError(message);
            return;
          }
          showToast(message, { type: 'error' });
        }
      };

      const handleEmailInput = (): void => {
        if (!(emailInput instanceof HTMLInputElement)) {
          return;
        }

        const email = emailInput.value.trim();

        if (!email || isValidEmail(email)) {
          setEmailError('');
        }
      };

      const handleAvatarClick = (): void => {
        if (avatarInput instanceof HTMLInputElement) {
          avatarInput.click();
        }
      };

      const handleAvatarChange = async (): Promise<void> => {
        if (!(avatarInput instanceof HTMLInputElement)) {
          return;
        }

        const file = avatarInput.files?.[0];

        if (!file) {
          return;
        }

        try {
          await updateProfileMultipart({}, file);
          navigate('/profile', { replace: true });
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Не удалось обновить аватар';
          showToast(message, { type: 'error' });
        } finally {
          avatarInput.value = '';
        }
      };

      if (logoutButton instanceof HTMLElement) {
        logoutButton.addEventListener('click', handleLogout);
      }

      if (profileForm instanceof HTMLFormElement) {
        profileForm.addEventListener('submit', handleProfileSubmit);
      }

      if (avatarEditButton instanceof HTMLButtonElement) {
        avatarEditButton.addEventListener('click', handleAvatarClick);
      }

      if (avatarInput instanceof HTMLInputElement) {
        avatarInput.addEventListener('change', handleAvatarChange);
      }

      if (emailInput instanceof HTMLInputElement) {
        emailInput.addEventListener('input', handleEmailInput);
      }

      return () => {
        if (logoutButton instanceof HTMLElement) {
          logoutButton.removeEventListener('click', handleLogout);
        }
        if (profileForm instanceof HTMLFormElement) {
          profileForm.removeEventListener('submit', handleProfileSubmit);
        }
        if (avatarEditButton instanceof HTMLButtonElement) {
          avatarEditButton.removeEventListener('click', handleAvatarClick);
        }
        if (avatarInput instanceof HTMLInputElement) {
          avatarInput.removeEventListener('change', handleAvatarChange);
        }
        if (emailInput instanceof HTMLInputElement) {
          emailInput.removeEventListener('input', handleEmailInput);
        }
      };
    },
  };
}
