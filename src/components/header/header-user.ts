export interface HeaderUserLike {
  name?: string;
  username?: string;
  userSurname?: string;
  email?: string;
}

export function getHeaderUserDisplayName(user: HeaderUserLike | null | undefined): string {
  if (user?.name) {
    return String(user.name).trim();
  }

  if (user?.username && user?.userSurname) {
    return `${String(user.username).trim()} ${String(user.userSurname).trim()}`.trim();
  }

  if (user?.username) {
    return String(user.username).trim();
  }

  if (user?.email) {
    return String(user.email).split('@')[0];
  }

  return '';
}
