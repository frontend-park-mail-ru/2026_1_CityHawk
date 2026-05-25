type EventVisibilitySource = {
  deleted?: boolean;
  deletedAt?: string | null;
  isDeleted?: boolean;
  status?: string;
};

export function isVisibleEvent(item: EventVisibilitySource | null | undefined): boolean {
  if (!item) {
    return false;
  }

  const status = String(item.status || '').trim().toLowerCase();

  return item.deleted !== true
    && item.isDeleted !== true
    && !item.deletedAt
    && status !== 'deleted'
    && status !== 'removed';
}
