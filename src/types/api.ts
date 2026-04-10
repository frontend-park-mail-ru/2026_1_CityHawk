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
  place: PlacePreview;
}

export interface EventCard {
  id: string;
  title: string;
  shortDescription?: string;
  coverImageUrl?: string;
  tags: Tag[];
  nextSession?: EventNextSession | null;
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

export interface PlaceListResponse {
  items: Place[];
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
  placeId: string;
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
  birthday?: string;
  avatarUrl?: string;
  city?: City | null;
  createdAt?: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface RegisterPayload {
  username: string;
  email: string;
  userSurname: string;
  password: string;
  birthday?: string;
  cityId?: string;
}

export interface ApiError extends Error {
  status?: number;
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
