/**
 * Attaches click handlers to password visibility toggle buttons within a root node.
 * Also keeps the confirmation password field in sync when it exists.
 *
 * @param {ParentNode} [root=document] Root element used to search for toggle controls.
 * @returns {void}
 */
export function attachPasswordToggles(root = document) {
  const toggles = root.querySelectorAll('.login__password-toggle');

  toggles.forEach((button) => {
    const field = button.closest('.login__field');
    const input = field ? field.querySelector('input') : null;
    const useEl = button.querySelector('svg use');

    if (!input || !useEl) return;

    button.addEventListener('click', () => {
      const isHidden = input.type === 'password';
      input.type = isHidden ? 'text' : 'password';

      useEl.setAttribute('href', isHidden ? '#eye-closed' : '#eye-open');

      const confirmField = root.querySelector('.login__field.confirm input');
      const confirmUse = root.querySelector('.login__field.confirm svg use');

      if (confirmField && confirmUse) {
        confirmField.type = isHidden ? 'text' : 'password';
        confirmUse.setAttribute('href', isHidden ? '#eye-closed' : '#eye-open');
      }
    });
  });
}
