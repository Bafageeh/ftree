import { API_URL } from './api';
import type { ChartEdge, Person, ReadingStatus } from '../types';

export type SupervisorDecision = 'approve' | 'pending' | 'reject';

export type PersonReviewPayload = {
  decision: SupervisorDecision;
  full_name?: string;
  reading_status?: ReadingStatus;
  note?: string;
};

export type EdgeReviewPayload = {
  decision: SupervisorDecision;
  reverse?: boolean;
  reading_status?: ReadingStatus;
  note?: string;
};

type PersonResourceResponse = { data: Person };
type EdgeResourceResponse = { data: ChartEdge };

async function postReview<T>(path: string, payload: unknown, missingMessage: string): Promise<T> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);

  try {
    const response = await fetch(`${API_URL}${path}`, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });

    const result = await response.json().catch(() => null) as { data?: T; message?: string; errors?: Record<string, string[]> } | null;
    if (!response.ok) {
      const message = result?.errors
        ? Object.values(result.errors).flat()[0]
        : result?.message;
      throw new Error(message || 'تعذر حفظ قرار المشرف.');
    }

    if (!result?.data) throw new Error(missingMessage);
    return result.data;
  } finally {
    clearTimeout(timeout);
  }
}

export function reviewPerson(personId: number, payload: PersonReviewPayload): Promise<Person> {
  return postReview<Person>(
    `/people/${personId}/review`,
    payload,
    'لم يعد الخادم بيانات الاسم بعد المراجعة.',
  );
}

export function reviewEdge(edgeId: number, payload: EdgeReviewPayload): Promise<ChartEdge> {
  return postReview<ChartEdge>(
    `/chart-edges/${edgeId}/review`,
    payload,
    'لم يعد الخادم بيانات العلاقة بعد المراجعة.',
  );
}
