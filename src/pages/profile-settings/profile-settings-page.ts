import { getMeOrNull, updateProfile, updateProfileMultipart } from '../../api/profile.api.js';
import { getCities } from '../../api/cities.api.js';
import { logout } from '../../api/auth.api.js';
import './profile-settings.css';
import '../../modules/auth/auth.css';
import '../../modules/profile/profile-form.css';
import { getHeaderUserDisplayName } from '../../components/header/header-user.js';
import { renderTemplate } from '../../app/templates/renderer.js';
import { showToast } from '../../app/ui/toast.js';
import {
  getEmailValidationError,
  validatePersonName,
} from '../../modules/auth/shared/validators.js';
import type { ApiError, UpdateProfilePayload } from '../../types/api.js';
import type { RouteContext, RouteView } from '../../types/router.js';

function animateLoginAside(root: HTMLElement): void {
  const loginEl = root.classList.contains('login') ? root : root.querySelector('.login');

  if (!(loginEl instanceof HTMLElement)) {
    return;
  }

  setTimeout(() => loginEl.classList.add('loaded'), 100);
}

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

export async function profileSettingsPage({ navigate }: RouteContext): Promise<RouteView> {
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

  const html = renderTemplate('profile-settings', {
    user,
    isProfilePage: false,
    isSettingsPage: true,
    enableAvatarUpload: true,
  });

  return {
    html,
    mount(root) {
      animateLoginAside(root);
      const logoutButton = root.querySelector('.profile__logout-link');
      const profileForm = root.querySelector('.profile__form');
      const avatarEditButton = root.querySelector('.profile__avatar-edit');
      const avatarInput = root.querySelector('[data-role="profile-avatar-input"]');
      const firstNameInput = root.querySelector('#firstName');
      const firstNameError = root.querySelector('.profile__name-error');
      const lastNameInput = root.querySelector('#lastName');
      const lastNameError = root.querySelector('.profile__surname-error');
      const emailInput = root.querySelector('#email');
      const emailError = root.querySelector('.profile__email-error');

      const setFieldError = (
        input: Element | null,
        errorNode: Element | null,
        message = '',
      ): void => {
        const text = String(message || '').trim();

        if (errorNode instanceof HTMLElement) {
          errorNode.textContent = text;
        }

        const field = input instanceof HTMLInputElement
          ? input.closest('.profile__field')
          : null;

        if (field instanceof HTMLElement) {
          field.classList.toggle('profile__field--error', Boolean(text));
        }
      };

      const setEmailError = (message = ''): void => {
        setFieldError(emailInput, emailError, message);
      };

      const setFirstNameError = (message = ''): void => {
        setFieldError(firstNameInput, firstNameError, message);
      };

      const setLastNameError = (message = ''): void => {
        setFieldError(lastNameInput, lastNameError, message);
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
        const firstName = String(formData.get('firstName') || '').trim();
        const lastName = String(formData.get('lastName') || '').trim();

        const firstNameValidationError = validatePersonName(firstName, 'Имя');
        const lastNameValidationError = validatePersonName(lastName, 'Фамилия');
        setFirstNameError(firstNameValidationError || '');
        setLastNameError(lastNameValidationError || '');

        const emailValidationError = getEmailValidationError(email);
        if (emailValidationError) {
          setEmailError(emailValidationError);
          return;
        }
        setEmailError('');

        if (firstNameValidationError || lastNameValidationError) {
          return;
        }

        const payload: UpdateProfilePayload = {
          email,
          username: firstName,
          userSurname: lastName,
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
          navigate('/profile/settings', { replace: true });
        } catch (error) {
          const apiError = error as ApiError;
          const details = apiError?.details || {};

          if (details.username) {
            setFirstNameError('Имя должно быть от 3 до 32 символов');
          }
          if (details.userSurname) {
            setLastNameError('Фамилия должна быть от 3 до 32 символов');
          }
          if (details.email) {
            setEmailError(getEmailValidationError(email) || 'Введите корректный email');
          }
          if (details.username || details.userSurname || details.email) {
            return;
          }

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

        setEmailError(getEmailValidationError(email) || '');
      };

      const handleFirstNameInput = (): void => {
        if (!(firstNameInput instanceof HTMLInputElement)) {
          return;
        }

        const message = validatePersonName(firstNameInput.value, 'Имя');
        setFirstNameError(message || '');
      };

      const handleLastNameInput = (): void => {
        if (!(lastNameInput instanceof HTMLInputElement)) {
          return;
        }

        const message = validatePersonName(lastNameInput.value, 'Фамилия');
        setLastNameError(message || '');
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
          navigate('/profile/settings', { replace: true });
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

      if (firstNameInput instanceof HTMLInputElement) {
        firstNameInput.addEventListener('input', handleFirstNameInput);
      }

      if (lastNameInput instanceof HTMLInputElement) {
        lastNameInput.addEventListener('input', handleLastNameInput);
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

        if (firstNameInput instanceof HTMLInputElement) {
          firstNameInput.removeEventListener('input', handleFirstNameInput);
        }

        if (lastNameInput instanceof HTMLInputElement) {
          lastNameInput.removeEventListener('input', handleLastNameInput);
        }
      };
    },
  };
}
