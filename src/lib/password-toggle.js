const OPEN_EYE_ICON = '/public/static/assets/eye.svg';
const CLOSED_EYE_ICON = '/public/static/assets/eye-closed.svg';

/**
 * Подключает обработчики показа и скрытия пароля для кнопок внутри указанного корневого узла.
 *
 * @param {ParentNode} [root=document] Корневой узел для поиска переключателей.
 * @returns {void}
 */
export function attachPasswordToggles(root = document) {
  const toggles = root.querySelectorAll('.login__password-toggle');

  toggles.forEach((button) => {
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
