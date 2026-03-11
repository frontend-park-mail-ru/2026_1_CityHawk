const OPEN_EYE_ICON = '/public/static/assets/eye.svg';
const CLOSED_EYE_ICON = '/public/static/assets/eye-closed.svg';

export function attachPasswordToggles(root = document) {
  // find every toggle button rather than only wrapping elements so that
  // confirm password fields (which use a different wrapper class) are
  // handled automatically.
  const toggles = root.querySelectorAll('.login__password-toggle');

  toggles.forEach((button) => {
    // look for the closest input in the same field wrapper
    const field = button.closest('.login__field');
    const input = field ? field.querySelector('input') : null;
    const icon = button.querySelector('img');

    if (!input) {
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

