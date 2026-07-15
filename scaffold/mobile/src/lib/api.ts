import Constants from 'expo-constants';

import type {
  ChartReading,
  ChartReadingStats,
  LineageResponse,
  PaginatedChartReadings,
  PaginatedPeople,
  Person,
  ReadingStatus,
  ReviewRequestPayload,
  ReviewRequestResponse,
  ReviewRequestStatus,
  Stats,
} from '../types';

const configuredUrl = process.env.EXPO_PUBLIC_API_URL
  ?? Constants.expoConfig?.extra?.apiUrl
  ?? 'https://shajara.pm.sa/api/v1';

export const API_URL = String(configuredUrl).replace(/\/$/, '');

const sourceReference = 'مشجرة أصول السادة آل باعلوي - الصفحة الوحيدة';
const fallbackSummary = 'بيان تأسيسي من المشجرة الأصلية، ويظل خاضعًا للمراجعة العلمية وربط المصادر.';
const fallbackChartReadingStats: ChartReadingStats = {
  total: 111,
  readable: 88,
  review: 19,
  unclear: 4,
  promoted: 0,
};

const fallbackPeople: Person[] = [
  { id: 1, full_name: 'محمد ﷺ', honorific: 'رسول الله ﷺ', lineage_parent_id: null, status: 'readable', generation: 1, chart_branch: 'central_trunk', chart_order: 1 },
  { id: 2, full_name: 'فاطمة الزهراء', honorific: 'رضي الله عنها', lineage_parent_id: 1, status: 'readable', generation: 2, chart_branch: 'central_trunk', chart_order: 2 },
  { id: 3, full_name: 'الحسين السبط', honorific: 'رضي الله عنه', lineage_parent_id: 2, status: 'readable', generation: 3, chart_branch: 'central_trunk', chart_order: 3 },
  { id: 4, full_name: 'علي زين العابدين', lineage_parent_id: 3, status: 'readable', generation: 4, chart_branch: 'central_trunk', chart_order: 4 },
  { id: 5, full_name: 'محمد الباقر', lineage_parent_id: 4, status: 'readable', generation: 5, chart_branch: 'central_trunk', chart_order: 5 },
  { id: 6, full_name: 'جعفر الصادق', lineage_parent_id: 5, status: 'readable', generation: 6, chart_branch: 'central_trunk', chart_order: 6 },
  { id: 7, full_name: 'علي العريضي', lineage_parent_id: 6, status: 'readable', generation: 7, chart_branch: 'central_trunk', chart_order: 7 },
  { id: 8, full_name: 'محمد النقيب', lineage_parent_id: 7, status: 'readable', generation: 8, chart_branch: 'central_trunk', chart_order: 8 },
  { id: 9, full_name: 'عيسى النقيب', lineage_parent_id: 8, status: 'readable', generation: 9, chart_branch: 'central_trunk', chart_order: 9 },
  { id: 10, full_name: 'أحمد المهاجر', lineage_parent_id: 9, status: 'readable', generation: 10, chart_branch: 'central_trunk', chart_order: 10 },
  { id: 11, full_name: 'عبيد الله', lineage_parent_id: 10, status: 'readable', generation: 11, chart_branch: 'central_trunk', chart_order: 11 },
  { id: 12, full_name: 'علوي', lineage_parent_id: 11, status: 'readable', generation: 12, chart_branch: 'central_trunk', chart_order: 12 },
  { id: 13, full_name: 'محمد', lineage_parent_id: 12, status: 'readable', generation: 13, chart_branch: 'central_trunk', chart_order: 13 },
  { id: 14, full_name: 'علوي', lineage_parent_id: 13, status: 'readable', generation: 14, chart_branch: 'central_trunk', chart_order: 14 },
  { id: 15, full_name: 'علي خالع قسم', lineage_parent_id: 14, status: 'readable', generation: 15, chart_branch: 'central_trunk', chart_order: 15 },
  { id: 16, full_name: 'محمد صاحب مرباط', lineage_parent_id: 15, status: 'readable', generation: 16, chart_branch: 'central_trunk', chart_order: 16 },
  { id: 17, full_name: 'علي بن محمد صاحب مرباط', honorific: 'والد الفقيه المقدم', lineage_parent_id: 16, status: 'readable', generation: 17, chart_branch: 'central_trunk', chart_order: 17 },
  { id: 18, full_name: 'محمد الفقيه المقدم', lineage_parent_id: 17, status: 'readable', generation: 18, chart_branch: 'central_trunk', chart_order: 18 },
  { id: 19, full_name: 'علوي بن الفقيه المقدم', lineage_parent_id: 18, status: 'readable', generation: 19, chart_branch: 'alawi_faqih', chart_order: 19 },
  { id: 20, full_name: 'علي بن علوي بن الفقيه المقدم', lineage_parent_id: 19, status: 'readable', generation: 20, chart_branch: 'ali_alawi_faqih', chart_order: 20 },
  { id: 21, full_name: 'عبد الله بن علوي بن الفقيه المقدم', lineage_parent_id: 19, status: 'readable', generation: 20, chart_branch: 'abdullah_alawi_faqih', chart_order: 21 },
  { id: 22, full_name: 'أحمد بن الفقيه المقدم', lineage_parent_id: 18, status: 'readable', generation: 19, chart_branch: 'ahmad_faqih', chart_order: 22 },
  { id: 23, full_name: 'علي بن الفقيه المقدم', lineage_parent_id: 18, status: 'readable', generation: 19, chart_branch: 'ali_faqih', chart_order: 23 },
  { id: 24, full_name: 'عبد الرحمن بن الفقيه المقدم', lineage_parent_id: 18, status: 'readable', generation: 19, chart_branch: 'abdulrahman_faqih', chart_order: 24 },
].map((person) => ({
  ...person,
  node_type: 'person',
  summary: fallbackSummary,
  source_reference: sourceReference,
  is_living: false,
}));

type RequestOptions = {
  method?: 'GET' | 'POST';
  body?: unknown;
};

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 12000);

  try {
    const response = await fetch(`${API_URL}${path}`, {
      method: options.method ?? 'GET',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: options.body === undefined ? undefined : JSON.stringify(options.body),
      signal: controller.signal,
    });

    const payload = await response.json().catch(() => null) as Record<string, unknown> | null;

    if (!response.ok) {
      const validationErrors = payload?.errors as Record<string, string[]> | undefined;
      const firstValidationError = validationErrors
        ? Object.values(validationErrors).flat()[0]
        : undefined;
      const message = firstValidationError
        ?? (typeof payload?.message === 'string' ? payload.message : null)
        ?? `تعذر إكمال الطلب (${response.status})`;
      throw new Error(message);
    }

    return payload as T;
  } finally {
    clearTimeout(timer);
  }
}

export async function getPeople(search = '', status = ''): Promise<Person[]> {
  const params = new URLSearchParams();
  if (search.trim()) params.set('search', search.trim());
  if (status) params.set('status', status);
  params.set('per_page', '100');

  try {
    const result = await request<PaginatedPeople>(`/people?${params.toString()}`);
    return result.data;
  } catch {
    return fallbackPeople.filter((person) => {
      const matchesSearch = !search.trim() || `${person.full_name} ${person.honorific ?? ''}`.includes(search.trim());
      const matchesStatus = !status || person.status === status;
      return matchesSearch && matchesStatus;
    });
  }
}

export async function getStats(): Promise<Stats> {
  try {
    return await request<Stats>('/stats');
  } catch {
    return {
      total: fallbackPeople.length,
      readable: fallbackPeople.filter((person) => person.status === 'readable').length,
      review: fallbackPeople.filter((person) => person.status === 'review').length,
      unclear: fallbackPeople.filter((person) => person.status === 'unclear').length,
      generations: Math.max(...fallbackPeople.map((person) => person.generation)),
      branches: new Set(fallbackPeople.map((person) => person.chart_branch).filter(Boolean)).size,
    };
  }
}

export async function getLineage(id: number): Promise<LineageResponse> {
  try {
    return await request<LineageResponse>(`/people/${id}/lineage`);
  } catch {
    const byId = new Map(fallbackPeople.map((person) => [person.id, person]));
    const path: Person[] = [];
    let person = byId.get(id) ?? fallbackPeople[0];
    const selected = person;
    const visited = new Set<number>();

    while (person && !visited.has(person.id)) {
      path.unshift(person);
      visited.add(person.id);
      person = person.lineage_parent_id ? byId.get(person.lineage_parent_id) : undefined;
    }

    return {
      person: selected,
      path,
      path_text: path.map((item) => item.full_name).join(' ← '),
    };
  }
}

export async function getChartReadings(status: ReadingStatus | '' = ''): Promise<ChartReading[]> {
  const params = new URLSearchParams({ per_page: '200' });
  if (status) params.set('status', status);
  const result = await request<PaginatedChartReadings>(`/chart-readings?${params.toString()}`);
  return result.data;
}

export async function getChartReadingStats(): Promise<ChartReadingStats> {
  try {
    const stats = await request<ChartReadingStats>('/chart-readings-stats');
    if (stats.total < 111) {
      return fallbackChartReadingStats;
    }
    return stats;
  } catch {
    return fallbackChartReadingStats;
  }
}

export function submitReviewRequest(payload: ReviewRequestPayload): Promise<ReviewRequestResponse> {
  return request<ReviewRequestResponse>('/review-requests', {
    method: 'POST',
    body: payload,
  });
}

export function getReviewRequestStatus(trackingCode: string): Promise<ReviewRequestStatus> {
  return request<ReviewRequestStatus>(`/review-requests/${encodeURIComponent(trackingCode.trim())}`);
}
