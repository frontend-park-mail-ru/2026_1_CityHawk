export const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export interface PasswordStrengthResult {
  msg: string;
  color: string;
  isError: boolean;
}

export function isValidEmail(value: string): boolean {
  return EMAIL_PATTERN.test(value.trim());
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
