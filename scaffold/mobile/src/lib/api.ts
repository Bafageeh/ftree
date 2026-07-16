import Constants from 'expo-constants';

import { bundledPeople } from '../generated/bundledPeople';
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

const coreNames = [
  'محمد ﷺ', 'فاطمة الزهراء', 'الحسين السبط', 'علي زين العابدين', 'محمد الباقر', 'جعفر الصادق',
  'علي العريضي', 'محمد النقيب', 'عيسى النقيب', 'أحمد المهاجر', 'عبيد الله', 'علوي', 'محمد', 'علوي',
  'علي خالع قسم', 'محمد صاحب مرباط', 'علي بن محمد صاحب مرباط', 'محمد الفقيه المقدم',
  'علوي بن الفقيه المقدم', 'علي بن علوي بن الفقيه المقدم', 'عبد الله بن علوي بن الفقيه المقدم',
  'أحمد بن الفقيه المقدم', 'علي بن الفقيه المقدم', 'عبد الرحمن بن الفقيه المقدم',
];

const coreFallback: Person[] = coreNames.map((full_name, index) => ({
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

const fallbackPeople = bundledPeople.length > coreFallback.length ? bundledPeople : coreFallback;
const bundledProvisionalCount = bundledPeople.filter((person) => person.is_provisional).length;

const fallbackChartReadingStats: ChartReadingStats = {
  total: Math.max(196, bundledProvisionalCount),
  readable: 165,
  review: 24,
  unclear: 7,
  promoted: Math.max(196, bundledProvisionalCount),
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

function filterPeople(source: Person[], search = '', status = ''): Person[] {
  const query = search.trim();
  return source.filter((person) => {
    const text = `${person.full_name} ${person.source_code ?? ''} ${person.honorific ?? ''} ${person.source_locator ?? ''}`;
    return (!query || text.includes(query)) && (!status || person.status === status);
  });
}

function statsFromPeople(source: Person[]): Stats {
  const generations = source.length ? Math.max(...source.map((person) => person.generation || 1)) : 0;
  return {
    total: source.length,
    confirmed: source.filter((person) => person.approval_status === 'supervisor_confirmed' && !person.is_provisional).length,
    pending_supervisor: source.filter((person) => person.approval_status === 'pending_supervisor' || person.is_provisional).length,
    readable: source.filter((person) => person.status === 'readable').length,
    review: source.filter((person) => person.status === 'review').length,
    unclear: source.filter((person) => person.status === 'unclear').length,
    generations,
    branches: new Set(source.map((person) => person.chart_branch).filter(Boolean)).size,
  };
}

export async function getPeople(search = '', status = ''): Promise<Person[]> {
  try {
    const result = await request<PaginatedPeople>('/people?per_page=250');
    const source = bundledPeople.length > result.data.length ? bundledPeople : result.data;
    return filterPeople(source, search, status);
  } catch {
    return filterPeople(fallbackPeople, search, status);
  }
}

export async function getStats(): Promise<Stats> {
  try {
    const stats = await request<Stats>('/stats');
    return bundledPeople.length > stats.total ? statsFromPeople(bundledPeople) : stats;
  } catch {
    return statsFromPeople(fallbackPeople);
  }
}

export async function getLineage(id: number): Promise<LineageResponse> {
  try {
    return await request<LineageResponse>(`/people/${id}/lineage`);
  } catch {
    const byId = new Map(fallbackPeople.map((person) => [person.id, person]));
    const selected = byId.get(id) ?? fallbackPeople[0];
    if (!selected) throw new Error('لا توجد بيانات لمسار النسب.');

    const path: Person[] = [];
    const visited = new Set<number>();
    let current: Person | undefined = selected;
    while (current && !visited.has(current.id)) {
      path.unshift(current);
      visited.add(current.id);
      current = current.lineage_parent_id ? byId.get(current.lineage_parent_id) : undefined;
    }
    return { person: selected, path, path_text: path.map((item) => item.full_name).join(' ← ') };
  }
}

export async function getChartReadings(status: ReadingStatus | '' = ''): Promise<ChartReading[]> {
  const params = new URLSearchParams({ per_page: '250' });
  if (status) params.set('status', status);
  return (await request<PaginatedChartReadings>(`/chart-readings?${params.toString()}`)).data;
}

export async function getChartReadingStats(): Promise<ChartReadingStats> {
  try {
    const stats = await request<ChartReadingStats>('/chart-readings-stats');
    return stats.total < fallbackChartReadingStats.total ? fallbackChartReadingStats : stats;
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
