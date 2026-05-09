import { getMeOrNull, updateProfile, updateProfileMultipart } from '../../api/profile.api.js';
import { getCities } from '../../api/cities.api.js';
import { getTags } from '../../api/tags.api.js';
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

  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      loginEl.classList.add('loaded');
    });
  });
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

function isUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

function parseInterestIds(rawValue: string): string[] {
  return Array.from(new Set(
    String(rawValue || '')
      .split(',')
      .map((item) => item.trim())
      .filter((item) => isUuid(item)),
  ));
}

export async function profileSettingsPage({ navigate }: RouteContext): Promise<RouteView> {
  const [meResult, citiesResult, tagsResult] = await Promise.allSettled([
    getMeOrNull(),
    getCities(),
    getTags(),
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

  const interestOptions = tagsResult.status === 'fulfilled' && Array.isArray(tagsResult.value?.items)
    ? tagsResult.value.items
      .map((tag) => ({
        value: String(tag?.id || '').trim(),
        label: String(tag?.name || '').trim(),
      }))
      .filter((option) => option.value && option.label)
    : [];

  const rawInterestIds = Array.isArray((me as { interestTagIds?: unknown[] } | null)?.interestTagIds)
    ? (me as { interestTagIds?: unknown[] }).interestTagIds
      ?.map((item) => String(item || '').trim())
      .filter((item) => isUuid(item)) || []
    : [];

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
    bio: String((me as { bio?: string } | null)?.bio || '').trim(),
    interestOptions,
    interestIdsCsv: rawInterestIds.join(','),
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
      const interestsInput = root.querySelector('[data-role="profile-interests-input"]');
      const interestsHidden = root.querySelector<HTMLInputElement>('[data-role="profile-interests-hidden"]');
      const interestsSelected = root.querySelector('[data-role="profile-interests-selected"]');
      const interestsOptions = root.querySelector<HTMLDataListElement>('[data-role="profile-interest-options"]');

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

      const interestIdToLabel = new Map<string, string>();
      const interestLabelToId = new Map<string, string>();
      if (interestsOptions instanceof HTMLDataListElement) {
        Array.from(interestsOptions.querySelectorAll('option')).forEach((option) => {
          const label = String(option.value || '').trim();
          const id = String(option.dataset.id || '').trim();

          if (!label || !id || !isUuid(id)) {
            return;
          }

          interestIdToLabel.set(id, label);
          interestLabelToId.set(label.toLowerCase(), id);
        });
      }

      let selectedInterestIds = parseInterestIds(interestsHidden?.value || '');

      const syncHiddenInterests = () => {
        if (interestsHidden instanceof HTMLInputElement) {
          interestsHidden.value = selectedInterestIds.join(',');
        }
      };

      const renderInterestChips = () => {
        if (!(interestsSelected instanceof HTMLElement)) {
          return;
        }

        interestsSelected.innerHTML = '';

        selectedInterestIds.forEach((id) => {
          const label = interestIdToLabel.get(id);
          if (!label) {
            return;
          }

          const chip = document.createElement('span');
          chip.className = 'profile__interest-chip';
          chip.textContent = label;

          const removeButton = document.createElement('button');
          removeButton.type = 'button';
          removeButton.className = 'profile__interest-chip-remove';
          removeButton.dataset.id = id;
          removeButton.setAttribute('aria-label', `Удалить интерес ${label}`);
          removeButton.textContent = '×';

          chip.append(removeButton);
          interestsSelected.append(chip);
        });
      };

      const addInterestByLabel = (rawLabel: string) => {
        const label = String(rawLabel || '').trim();
        if (!label) {
          return;
        }

        const id = interestLabelToId.get(label.toLowerCase()) || '';
        if (!id || !isUuid(id)) {
          return;
        }

        if (!selectedInterestIds.includes(id)) {
          selectedInterestIds = [...selectedInterestIds, id];
          syncHiddenInterests();
          renderInterestChips();
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

        const bio = String(formData.get('bio') || '').trim();
        const interestTagIds = parseInterestIds(String(formData.get('interests') || ''));
        const extendedPayload = payload as UpdateProfilePayload & {
          bio?: string;
          interestTagIds?: string[];
        };

        if (bio) {
          extendedPayload.bio = bio;
        }
        if (interestTagIds.length) {
          extendedPayload.interestTagIds = interestTagIds;
        }

        try {
          await updateProfile(extendedPayload as UpdateProfilePayload);
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

      const handleInterestsInput = (): void => {
        if (!(interestsInput instanceof HTMLInputElement)) {
          return;
        }

        addInterestByLabel(interestsInput.value);
      };

      const handleInterestsKeydown = (event: KeyboardEvent): void => {
        if (!(interestsInput instanceof HTMLInputElement)) {
          return;
        }

        if (event.key === 'Enter' || event.key === ',' || event.key === 'Tab') {
          addInterestByLabel(interestsInput.value);
          interestsInput.value = '';
          if (event.key !== 'Tab') {
            event.preventDefault();
          }
        }
      };

      const handleInterestChipClick = (event: Event): void => {
        const target = event.target;
        if (!(target instanceof HTMLElement)) {
          return;
        }

        const removeButton = target.closest<HTMLButtonElement>('.profile__interest-chip-remove');
        if (!(removeButton instanceof HTMLButtonElement)) {
          return;
        }

        const id = String(removeButton.dataset.id || '').trim();
        if (!id) {
          return;
        }

        selectedInterestIds = selectedInterestIds.filter((item) => item !== id);
        syncHiddenInterests();
        renderInterestChips();
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

      if (interestsInput instanceof HTMLInputElement) {
        interestsInput.addEventListener('change', handleInterestsInput);
        interestsInput.addEventListener('keydown', handleInterestsKeydown);
      }

      if (interestsSelected instanceof HTMLElement) {
        interestsSelected.addEventListener('click', handleInterestChipClick);
      }

      syncHiddenInterests();
      renderInterestChips();

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

        if (interestsInput instanceof HTMLInputElement) {
          interestsInput.removeEventListener('change', handleInterestsInput);
          interestsInput.removeEventListener('keydown', handleInterestsKeydown);
        }

        if (interestsSelected instanceof HTMLElement) {
          interestsSelected.removeEventListener('click', handleInterestChipClick);
        }
      };
    },
  };
}
