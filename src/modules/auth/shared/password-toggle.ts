export function attachPasswordToggles(root: ParentNode = document): void {
  const toggles = root.querySelectorAll('.login__password-toggle');

  toggles.forEach((button) => {
    if (!(button instanceof HTMLButtonElement)) {
      return;
    }

    const field = button.closest('.login__field');
    const input = field?.querySelector('input');
    const useEl = button.querySelector('svg use');

    if (!(input instanceof HTMLInputElement) || !(useEl instanceof SVGUseElement)) {
      return;
    }

    button.addEventListener('click', () => {
      const isHidden = input.type === 'password';
      input.type = isHidden ? 'text' : 'password';

      useEl.setAttribute('href', isHidden ? '#eye-closed' : '#eye-open');

      const confirmField = root.querySelector('.login__field.confirm input');
      const confirmUse = root.querySelector('.login__field.confirm svg use');

      if (confirmField instanceof HTMLInputElement && confirmUse instanceof SVGUseElement) {
        confirmField.type = isHidden ? 'text' : 'password';
        confirmUse.setAttribute('href', isHidden ? '#eye-closed' : '#eye-open');
      }
    });
  });
}
