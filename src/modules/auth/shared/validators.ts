export const EMAIL_LOCAL_PATTERN = /^[A-Za-z0-9.!#$%&'*+/=?^_`{|}~-]+$/;
export const EMAIL_DOMAIN_LABEL_PATTERN = /^[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?$/;

export interface PasswordStrengthResult {
  msg: string;
  color: string;
  isError: boolean;
}

export function isValidEmail(value: string): boolean {
  const trimmed = value.trim();
  const parts = trimmed.split('@');

  if (parts.length !== 2) {
    return false;
  }

  const [localPart, domain] = parts;
  const domainLabels = domain.split('.');

  if (!localPart
    || !domain
    || localPart.length > 64
    || domain.length > 253
    || localPart.startsWith('.')
    || localPart.endsWith('.')
    || localPart.includes('..')
    || !EMAIL_LOCAL_PATTERN.test(localPart)
    || domainLabels.length < 2) {
    return false;
  }

  return domainLabels.every((label) => EMAIL_DOMAIN_LABEL_PATTERN.test(label))
    && domainLabels[domainLabels.length - 1].length >= 2;
}

export function getEmailValidationError(value: string): string | null {
  const trimmed = value.trim();

  if (!trimmed) {
    return 'Введите email';
  }

  if (trimmed.length > 254) {
    return 'Email не может быть длиннее 254 символов';
  }

  if (!isValidEmail(trimmed)) {
    return 'Введите email в формате address@service.com';
  }

  return null;
}

export function checkPasswordStrength(pass: string): PasswordStrengthResult {
  if (!pass) {
    return { msg: 'Введите пароль', color: 'var(--color-mid)', isError: true };
  }

  if (pass.length < 8) {
    return { msg: 'Минимум 8 символов', color: 'var(--color-mid)', isError: true };
  }

  if (!/[a-z]/.test(pass) || !/[A-Z]/.test(pass)) {
    return { msg: 'Добавьте строчные и заглавные буквы', color: 'orange', isError: true };
  }

  if (!/[^\p{L}\p{N}\s]/u.test(pass)) {
    return { msg: 'Добавьте спецсимвол', color: 'gold', isError: true };
  }

  return { msg: 'Надёжный пароль', color: 'green', isError: false };
}

export function validatePersonName(value: string, fieldLabel: string): string | null {
  const trimmed = value.trim();

  if (!trimmed) {
    return `Введите ${fieldLabel.toLowerCase()}`;
  }

  const length = Array.from(trimmed).length;
  if (length < 3 || length > 32) {
    return `${fieldLabel}: от 3 до 32 символов`;
  }

  if (trimmed.includes('@') || isValidEmail(trimmed)) {
    return `${fieldLabel} не может быть email`;
  }

  if (!/^[\p{L}\p{N}_-]+$/u.test(trimmed)) {
    return `${fieldLabel} может содержать только буквы, цифры, "_" и "-"`;
  }

  return null;
}
