import { getMeOrNull, updateProfile } from '../../api/profile.api.js';
import { logout } from '../../api/auth.api.js';
import { getHeaderUserDisplayName } from '../../components/header/header-user.js';
import { renderTemplate } from '../../app/templates/renderer.js';
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
  const me = await getMeOrNull();
  const displayName = getHeaderUserDisplayName(me) || 'Имя';
  const user = {
    name: displayName,
    firstName: me?.username || '',
    lastName: me?.userSurname || '',
    email: me?.email || 'address@service.com',
    birthdate: me?.birthday || '',
    cityId: me?.city?.id || '',
    cityName: me?.city?.name || '',
    cityOptions: [
      {
        value: me?.city?.id || '',
        label: me?.city?.name || 'Выберите город',
        selected: true,
      },
    ],
    initials: getUserInitials(displayName),
    avatarUrl: me?.avatarUrl || '',
  };

  const html = renderTemplate('profile', { user });

  return {
    html,
    mount(root) {
      const logoutButton = root.querySelector('.profile__logout-link');
      const profileForm = root.querySelector('.profile__form');

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
        const payload: UpdateProfilePayload = {
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
          window.alert(message);
        }
      };

      if (logoutButton instanceof HTMLElement) {
        logoutButton.addEventListener('click', handleLogout);
      }

      if (profileForm instanceof HTMLFormElement) {
        profileForm.addEventListener('submit', handleProfileSubmit);
      }

      return () => {
        if (logoutButton instanceof HTMLElement) {
          logoutButton.removeEventListener('click', handleLogout);
        }
        if (profileForm instanceof HTMLFormElement) {
          profileForm.removeEventListener('submit', handleProfileSubmit);
        }
      };
    },
  };
}
