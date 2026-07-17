import { API_URL } from './api';
import type { Person, ReadingStatus } from '../types';

export type SupervisorDecision = 'approve' | 'pending' | 'reject';

export type PersonReviewPayload = {
  decision: SupervisorDecision;
  full_name?: string;
  reading_status?: ReadingStatus;
  note?: string;
};

type PersonResourceResponse = { data: Person };

export async function reviewPerson(personId: number, payload: PersonReviewPayload): Promise<Person> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);

  try {
    const response = await fetch(`${API_URL}/people/${personId}/review`, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });

    const result = await response.json().catch(() => null) as PersonResourceResponse | { message?: string; errors?: Record<string, string[]> } | null;
    if (!response.ok) {
      const errors = result && 'errors' in result ? result.errors : undefined;
      const message = errors ? Object.values(errors).flat()[0] : result && 'message' in result ? result.message : undefined;
      throw new Error(message || 'تعذر حفظ قرار المشرف.');
    }

    if (!result || !('data' in result)) throw new Error('لم يعد الخادم بيانات الاسم بعد المراجعة.');
    return result.data;
  } finally {
    clearTimeout(timeout);
  }
}
