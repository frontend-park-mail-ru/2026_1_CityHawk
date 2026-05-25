export interface City {
  id: string;
  name: string;
  countryName: string;
  timezone: string;
}

export interface PlacePreview {
  name: string;
  addressLine: string;
}

export interface Place extends PlacePreview {
  id: string;
  latitude?: number;
  longitude?: number;
  city?: City | null;
}

export interface Tag {
  id: string;
  name: string;
  slug: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
}

export interface EventNextSession {
  startAt: string;
  place?: PlacePreview | null;
  placeName?: string;
}

export interface EventCard {
  id: string;
  title: string;
  shortDescription?: string;
  coverImageUrl?: string;
  tags: Tag[];
  nextSession?: EventNextSession | null;
  isFavorite?: boolean;
}

export interface EventAuthor {
  id: string;
  username: string;
  avatarUrl?: string | null;
}

export interface EventImage {
  id: string;
  imageUrl: string;
}

export interface EventSession {
  id: string;
  startAt: string;
  endAt: string;
  price: number;
  placeId?: string;
  placeName?: string;
  place?: Place | null;
}

export interface EventDetails {
  id: string;
  title: string;
  shortDescription: string;
  fullDescription: string;
  ageLimit: number;
  sourceUrl: string;
  author: EventAuthor;
  categories: Category[];
  tags: Tag[];
  images: EventImage[];
  sessions: EventSession[];
  createdAt: string;
  updatedAt: string;
  isFavorite: boolean;
  isOwner: boolean;
  placeName?: string;
  place?: Place | null;
  coverImageUrl?: string;
}

export interface Collection {
  id: string;
  title: string;
  description: string;
  imageUrl?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  limit: number;
  offset: number;
}

export interface HomeResponse {
  featuredEvents: EventCard[];
  categories: Category[];
  collections: Collection[];
}

export interface CategoryListResponse {
  items: Category[];
}

export interface TagListResponse {
  items: Tag[];
}

export interface PlaceListResponse {
  items: Place[];
}

export interface CityListResponse {
  items: City[];
}

export interface EventIdResponse {
  id: string;
}

export interface EventsQueryParams {
  query?: string;
  categoryId?: string;
  tagId?: string;
  cityId?: string;
  dateFrom?: string;
  dateTo?: string;
  authorId?: string;
  sort?: string;
  limit?: number;
  offset?: number;
}

export interface EventSessionPayload {
  placeId?: string;
  placeName?: string;
  startAt: string;
  endAt: string;
  price: number;
}

export interface EventPayload {
  title: string;
  shortDescription: string;
  fullDescription: string;
  ageLimit: number;
  sourceUrl: string;
  categoryIds: string[];
  tagIds: string[];
  imageUrls: string[];
  sessions: EventSessionPayload[];
}

export interface User {
  id?: string;
  email: string;
  name?: string;
  username?: string;
  userSurname?: string;
  role?: 'user' | 'organizer' | 'admin';
  birthday?: string;
  avatarUrl?: string;
  city?: City | null;
  createdAt?: string;
}

export interface FollowUser {
  id: string;
  username: string;
  userSurname?: string;
  email?: string;
  avatarUrl?: string | null;
  city?: City | null;
  isFollowing?: boolean;
}

export interface FollowListResponse {
  items: FollowUser[];
  total: number;
  limit: number;
  offset: number;
}

export type InvitationStatus = 'pending' | 'accepted' | 'declined' | 'cancelled';

export interface EventInvitee extends FollowUser {
  invitationStatus?: InvitationStatus | null;
}

export interface EventInviteeSearchResponse {
  items: EventInvitee[];
}

export interface CreateEventInvitationsPayload {
  recipientIds: string[];
  message?: string;
  eventSessionId?: string;
}

export interface EventInvitation {
  id: string;
  eventId: string;
  eventSessionId?: string | null;
  senderId: string;
  recipientId: string;
  status: InvitationStatus;
  message?: string;
  respondedAt?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface EventInvitationsResponse {
  items: EventInvitation[];
}

export interface ShareLinkResponse {
  id: string;
  url: string;
  token: string;
  eventId?: string;
  collectionId?: string;
  createdAt: string;
}

export type NotificationType =
  | 'event_invitation'
  | 'invitation_accepted'
  | 'event_reminder'
  | 'collection_shared'
  | 'system';

export interface NotificationActor {
  id: string;
  displayName: string;
  avatarUrl?: string | null;
}

export interface NotificationEventSummary {
  id: string;
  title: string;
  coverImageUrl?: string;
  dateText?: string;
  placeText?: string;
}

export interface NotificationInvitationSummary {
  id: string;
  status: InvitationStatus;
}

export interface NotificationItem {
  id: string;
  type: NotificationType;
  title: string;
  message?: string;
  isRead: boolean;
  readAt?: string | null;
  createdAt: string;
  actor?: NotificationActor | null;
  event?: NotificationEventSummary | null;
  invitation?: NotificationInvitationSummary | null;
}

export interface NotificationsResponse {
  items: NotificationItem[];
  unreadCount: number;
  total: number;
  limit: number;
  offset: number;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface RegisterPayload {
  email: string;
  password: string;
}

export interface UpdateProfilePayload {
  email?: string;
  username?: string;
  userSurname?: string;
  birthday?: string;
  cityId?: string;
  avatarUrl?: string;
}

export interface ApiError extends Error {
  status?: number;
  details?: Record<string, string>;
}

export interface AuthUser {
  id: string;
  email: string;
  username: string;
  userSurname?: string;
  avatarUrl?: string | null;
  createdAt?: string;
}

export interface AuthOkResponse {
  ok: true;
}

export type SupportCategory = 'bug' | 'suggestion' | 'product_complaint' | 'other';

export type SupportStatus = 'open' | 'in_progress' | 'closed';

export interface SupportTicket {
  id: string;
  category: SupportCategory;
  status: SupportStatus;
  title: string;
  message: string;
  createdAt: string;
  updatedAt: string;
  closedAt: string | null;
}

export interface SupportTicketListResponse {
  items: SupportTicket[];
  limit: number;
  offset: number;
}

export interface SupportTicketQueryParams {
  status?: SupportStatus;
  category?: SupportCategory;
  limit?: number;
  offset?: number;
}

export interface CreateSupportTicketPayload {
  category: SupportCategory;
  title: string;
  message: string;
}

export type UpdateSupportTicketPayload = Partial<CreateSupportTicketPayload>;

export interface UpdateSupportTicketStatusPayload {
  status: SupportStatus;
}

export interface SupportMessage {
  id: string;
  ticketId: string;
  authorUserId: string;
  authorRole: 'user' | 'admin';
  body: string;
  createdAt: string;
}

export interface SupportMessageListResponse {
  items: SupportMessage[];
}

export interface CreateSupportMessagePayload {
  body: string;
}

export interface SupportStats {
  total: number;
  byStatus: Record<SupportStatus, number>;
  byCategory: Record<SupportCategory, number>;
  openTotal: number;
  inProgressTotal: number;
  closedTotal: number;
}

export interface SupportStatsQueryParams {
  from?: string;
  to?: string;
}

export interface MapCollection {
  id: string;
  title: string;
  description: string;
  imageUrl?: string;
  eventsCount: number;
  isPublic: boolean;
}

export interface MapCollectionsResponse {
  items: MapCollection[];
}

export interface MapOption {
  value: string;
  label: string;
}

export interface MapFiltersResponse {
  tags: Tag[];
  datePresets: MapOption[];
  sortOptions: MapOption[];
}

export interface MapSpot {
  id: string;
  eventId: string;
  title: string;
  address: string;
  latitude?: number;
  longitude?: number;
  place?: Place | null;
  imageUrl?: string;
  startAt?: string;
  popularity: number;
  tags: Tag[];
}

export interface MapCollectionMeta {
  id: string;
  title: string;
}

export interface MapCollectionSpotsResponse {
  collection: MapCollectionMeta;
  items: MapSpot[];
  total: number;
  limit: number;
  offset: number;
}
