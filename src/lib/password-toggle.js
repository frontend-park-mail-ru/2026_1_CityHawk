/**
 * Подключает обработчики клика для кнопок показа/скрытия пароля внутри указанного корневого узла.
 * Каждая кнопка управляет только своим полем пароля, что позволяет нескольким независимым
 * полям (например, пароль и подтверждение пароля) работать без перекрытия.
 *
 * @param {ParentNode} [root=document] - Корневой элемент, в котором выполняется поиск переключателей пароля.
 * @returns {void}
 */
export function attachPasswordToggles(root = document) {
  const toggles = root.querySelectorAll('.login__password-toggle');

  toggles.forEach((button) => {
    const field = button.closest('.login__field');
    const input = field?.querySelector('input');
    const useEl = button.querySelector('svg use');

    if (!input || !useEl) return;

    button.addEventListener('click', () => {
      const isHidden = input.type === 'password';

      input.type = isHidden ? 'text' : 'password';

      useEl.setAttribute(
        'href',
        isHidden ? '#eye-closed' : '#eye-open'
      );
    });
  });
}
