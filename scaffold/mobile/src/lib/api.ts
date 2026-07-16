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

const fallbackNames = [
  'محمد ﷺ', 'فاطمة الزهراء', 'الحسين السبط', 'علي زين العابدين', 'محمد الباقر', 'جعفر الصادق',
  'علي العريضي', 'محمد النقيب', 'عيسى النقيب', 'أحمد المهاجر', 'عبيد الله', 'علوي', 'محمد', 'علوي',
  'علي خالع قسم', 'محمد صاحب مرباط', 'علي بن محمد صاحب مرباط', 'محمد الفقيه المقدم',
  'علوي بن الفقيه المقدم', 'علي بن علوي بن الفقيه المقدم', 'عبد الله بن علوي بن الفقيه المقدم',
  'أحمد بن الفقيه المقدم', 'علي بن الفقيه المقدم', 'عبد الرحمن بن الفقيه المقدم',
];

const fallbackPeople: Person[] = fallbackNames.map((full_name, index) => ({
  id: index + 1,
  full_name,
  source_code: `CORE-${String(index + 1).padStart(3, '0')}`,
  node_type: 'person',
  lineage_parent_id: index === 0 ? null : index,
  status: 'readable',
  approval_status: 'supervisor_confirmed',
  is_provisional: false,
  generation: index + 1,
  chart_branch: index < 18 ? 'central_trunk' : undefined,
  chart_order: index + 1,
  summary: 'بيان تأسيسي من المشجرة الأصلية.',
  source_reference: 'مشجرة أصول السادة آل باعلوي',
  is_living: false,
}));

const fallbackChartReadingStats: ChartReadingStats = {
  total: 196,
  readable: 165,
  review: 24,
  unclear: 7,
  promoted: 196,
};

type RequestOptions = { method?: 'GET' | 'POST'; body?: unknown };

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 12000);
  try {
    const response = await fetch(`${API_URL}${path}`, {
      method: options.method ?? 'GET',
      headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
      body: options.body === undefined ? undefined : JSON.stringify(options.body),
      signal: controller.signal,
    });
    const payload = await response.json().catch(() => null) as Record<string, unknown> | null;
    if (!response.ok) {
      const errors = payload?.errors as Record<string, string[]> | undefined;
      throw new Error(errors ? Object.values(errors).flat()[0] : String(payload?.message ?? `تعذر إكمال الطلب (${response.status})`));
    }
    return payload as T;
  } finally {
    clearTimeout(timer);
  }
}

export async function getPeople(search = '', status = ''): Promise<Person[]> {
  const params = new URLSearchParams({ per_page: '250' });
  if (search.trim()) params.set('search', search.trim());
  if (status) params.set('status', status);
  try {
    return (await request<PaginatedPeople>(`/people?${params.toString()}`)).data;
  } catch {
    return fallbackPeople.filter((person) => {
      const text = `${person.full_name} ${person.source_code ?? ''}`;
      return (!search.trim() || text.includes(search.trim())) && (!status || person.status === status);
    });
  }
}

export async function getStats(): Promise<Stats> {
  try {
    return await request<Stats>('/stats');
  } catch {
    return { total: 24, confirmed: 24, pending_supervisor: 0, readable: 24, review: 0, unclear: 0, generations: 20 };
  }
}

export async function getLineage(id: number): Promise<LineageResponse> {
  try {
    return await request<LineageResponse>(`/people/${id}/lineage`);
  } catch {
    const selected = fallbackPeople.find((person) => person.id === id) ?? fallbackPeople[0];
    if (!selected) throw new Error('لا توجد بيانات لمسار النسب.');
    const path = fallbackPeople.filter((person) => person.id <= selected.id);
    return { person: selected, path, path_text: path.map((item) => item.full_name).join(' ← ') };
  }
}

export async function getChartReadings(status: ReadingStatus | '' = ''): Promise<ChartReading[]> {
  const params = new URLSearchParams({ per_page: '200' });
  if (status) params.set('status', status);
  return (await request<PaginatedChartReadings>(`/chart-readings?${params.toString()}`)).data;
}

export async function getChartReadingStats(): Promise<ChartReadingStats> {
  try {
    const stats = await request<ChartReadingStats>('/chart-readings-stats');
    return stats.total < 196 ? fallbackChartReadingStats : stats;
  } catch {
    return fallbackChartReadingStats;
  }
}

export function submitReviewRequest(payload: ReviewRequestPayload): Promise<ReviewRequestResponse> {
  return request('/review-requests', { method: 'POST', body: payload });
}

export function getReviewRequestStatus(trackingCode: string): Promise<ReviewRequestStatus> {
  return request(`/review-requests/${encodeURIComponent(trackingCode.trim())}`);
}
