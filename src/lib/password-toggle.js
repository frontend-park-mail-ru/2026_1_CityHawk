/**
 * Attaches click handlers to password visibility toggle buttons within a root node.
 * Each toggle controls only its own password input, allowing multiple independent fields
 * (e.g., password and password confirmation) to work without interfering with each other.
 *
 * @param {ParentNode} [root=document] - The root element within which to search for password toggles.
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
