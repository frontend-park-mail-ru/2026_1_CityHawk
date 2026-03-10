const OPEN_EYE_ICON = '/public/static/assets/eye.svg';
const CLOSED_EYE_ICON = '/public/static/assets/eye-closed.svg';

export function attachPasswordToggles(root = document) {
  const passwordFields = root.querySelectorAll('.login__password');

  passwordFields.forEach((field) => {
    const input = field.querySelector('input');
    const button = field.querySelector('.login__password-toggle');
    const icon = button?.querySelector('img');

    if (!input || !button) {
      return;
    }

    button.addEventListener('click', () => {
      const isHidden = input.type === 'password';
      input.type = isHidden ? 'text' : 'password';

      if (icon) {
        icon.src = isHidden ? CLOSED_EYE_ICON : OPEN_EYE_ICON;
      }
    });
  });
}
