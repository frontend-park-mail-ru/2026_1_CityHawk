export const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export interface PasswordStrengthResult {
  msg: string;
  color: string;
  isError: boolean;
}

export function isValidEmail(value: string): boolean {
  return EMAIL_PATTERN.test(value.trim());
}

export function getEmailValidationError(value: string): string | null {
  const trimmed = value.trim();

  if (!trimmed) {
    return 'Поле email не должно быть пустым!';
  }

  if (trimmed.length > 254) {
    return 'Email не должен быть длиннее 254 символов';
  }

  if (!isValidEmail(trimmed)) {
    return 'Введите email в формате address@service.com!';
  }

  return null;
}

export function checkPasswordStrength(pass: string): PasswordStrengthResult {
  if (!pass) {
    return { msg: 'Пароль не должен быть пустым!', color: 'var(--color-mid)', isError: true };
  }

  if (pass.length < 8) {
    return { msg: 'Пароль должен содержать не менее 8 символов!', color: 'var(--color-mid)', isError: true };
  }

  if (!/[a-z]/.test(pass) || !/[A-Z]/.test(pass)) {
    return { msg: 'Пароль должен содержать буквы в разном регистре!', color: 'orange', isError: true };
  }

  if (!/[!@#$%^&*]/.test(pass)) {
    return { msg: 'Пароль должен содержать спецсимволы!', color: 'gold', isError: true };
  }

  return { msg: 'Ваш пароль достаточно надежный!', color: 'green', isError: false };
}

export function validatePersonName(value: string, fieldLabel: string): string | null {
  const trimmed = value.trim();

  if (!trimmed) {
    return `${fieldLabel} не должно быть пустым`;
  }

  const length = Array.from(trimmed).length;
  if (length < 3 || length > 32) {
    return `${fieldLabel} должно быть от 3 до 32 символов`;
  }

  if (trimmed.includes('@') || isValidEmail(trimmed)) {
    return `${fieldLabel} не должно быть email`;
  }

  if (!/^[\p{L}\p{N}_-]+$/u.test(trimmed)) {
    return `${fieldLabel} может содержать только буквы, цифры, "_" и "-"`;
  }

  return null;
}
