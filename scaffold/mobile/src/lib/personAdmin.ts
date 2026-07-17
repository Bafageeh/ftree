import { API_URL } from './api';
import type { Person, ReadingStatus } from '../types';

type UpdatePersonPayload = {
  full_name: string;
  source_code?: string | null;
  honorific?: string | null;
  status: ReadingStatus;
  supervisor_note?: string | null;
};

type AddChildrenResponse = {
  message: string;
  created_count: number;
  children: Person[];
};

type DeletePersonResponse = {
  message: string;
  deleted_count: number;
  descendants_deleted: number;
};

async function request<T>(path: string, method: 'PATCH' | 'POST' | 'DELETE', body?: unknown): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 15000);

  try {
    const response = await fetch(`${API_URL}${path}`, {
      method,
      headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
      body: body === undefined ? undefined : JSON.stringify(body),
      signal: controller.signal,
    });
    const payload = await response.json().catch(() => null) as Record<string, unknown> | null;

    if (!response.ok) {
      const errors = payload?.errors as Record<string, string[]> | undefined;
      const message = errors
        ? Object.values(errors).flat()[0]
        : String(payload?.message ?? `تعذر إكمال الطلب (${response.status})`);
      throw new Error(message);
    }

    return payload as T;
  } finally {
    clearTimeout(timer);
  }
}

export function updatePersonDetails(personId: number, payload: UpdatePersonPayload): Promise<Person> {
  return request<Person>(`/people/${personId}`, 'PATCH', payload);
}

export function addChildrenToPerson(personId: number, count: number, names: string[]): Promise<AddChildrenResponse> {
  return request<AddChildrenResponse>(`/people/${personId}/children`, 'POST', { count, names });
}

export function deletePersonSubtree(personId: number): Promise<DeletePersonResponse> {
  return request<DeletePersonResponse>(`/people/${personId}`, 'DELETE');
}
