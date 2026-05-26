export interface HeaderUserLike {
  name?: string;
  username?: string;
  email?: string;
}

export function getHeaderUserDisplayName(user: HeaderUserLike | null | undefined): string {
  if (user?.name) {
    return String(user.name).trim();
  }

  if (user?.username) {
    return String(user.username).trim();
  }

  if (user?.email) {
    const email = String(user.email).trim();
    const [localPart] = email.split('@');
    return localPart || email;
  }

  return '';
}
