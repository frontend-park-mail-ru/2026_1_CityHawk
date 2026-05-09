import { request } from './client.js';

export interface OrganizerApplicationPayload {
  name: string;
  email: string;
  phone: string;
  city: string;
  projectName: string;
  categories: string;
  links?: string;
  about: string;
  consent: boolean;
}

export interface OrganizerApplicationCreateResponse {
  id: string;
  status: 'pending' | 'needs_info' | 'approved' | 'rejected';
  createdAt: string;
}

export async function createOrganizerApplication(
  payload: OrganizerApplicationPayload,
): Promise<OrganizerApplicationCreateResponse> {
  return request<OrganizerApplicationCreateResponse>('/api/organizer/applications', {
    method: 'POST',
    body: payload,
  });
}
