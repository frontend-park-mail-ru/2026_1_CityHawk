export function getErrorMessageElement(wrapper: Element | null): HTMLElement | null {
  const errorMsg = wrapper?.querySelector('.login__error-message');
  return errorMsg instanceof HTMLElement ? errorMsg : null;
}

export function showFieldError(wrapper: Element | null, msg: string): void {
  wrapper?.classList.add('login__field-error-wrapper--error');
  const errorMsg = getErrorMessageElement(wrapper);
  if (errorMsg) {
    errorMsg.textContent = msg;
  }
}

export function hideFieldError(wrapper: Element | null): void {
  wrapper?.classList.remove('login__field-error-wrapper--error');
  const errorMsg = getErrorMessageElement(wrapper);
  if (errorMsg) {
    errorMsg.textContent = '';
  }
}

export function showFieldMessage(
  wrapper: Element | null,
  msg: string,
  color: string,
  showBorder = true,
): void {
  const errorMsg = getErrorMessageElement(wrapper);

  if (errorMsg) {
    errorMsg.textContent = msg;
    errorMsg.style.color = color || 'var(--color-mid)';
  }

  if (showBorder) {
    wrapper?.classList.add('login__field-error-wrapper--error');
  } else {
    wrapper?.classList.remove('login__field-error-wrapper--error');
  }
}

export function hideFieldMessage(wrapper: Element | null): void {
  const errorMsg = getErrorMessageElement(wrapper);

  if (errorMsg) {
    errorMsg.textContent = '';
    errorMsg.style.color = '';
  }

  wrapper?.classList.remove('login__field-error-wrapper--error');
}
