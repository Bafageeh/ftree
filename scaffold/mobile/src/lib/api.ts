import Constants from 'expo-constants';

import { bundledPeople } from '../generated/bundledPeople';
import type {
  ChartEdge,
  ChartEdgeResponse,
  ChartEdgeStats,
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

function bundledReadingConfidence(status: ReadingStatus): number {
  if (status === 'readable') return 98;
  if (status === 'review') return 82;
  return 55;
}

function readingsFromPeople(source: Person[]): ChartReading[] {
  const byId = new Map(source.map((person) => [person.id, person]));
  return source
    .filter((person) => person.is_provisional || person.approval_status === 'pending_supervisor')
    .map((person) => ({
      id: person.chart_reading_id ?? -(100000 + person.id),
      source_key: person.source_code ?? `PERSON-${person.id}`,
      provisional_name: person.full_name,
      normalized_name: person.status === 'readable' ? person.full_name : null,
      parent_source_key: person.lineage_parent_id ? byId.get(person.lineage_parent_id)?.source_code ?? null : null,
      chart_branch: person.chart_branch,
      chart_color: person.chart_color,
      node_type: person.node_type ?? 'person',
      reading_status: person.status,
      confidence: bundledReadingConfidence(person.status),
      source_locator: person.source_locator,
      notes: person.summary,
      is_promoted: true,
      person_id: person.id,
    }));
}

const fallbackChartReadings = readingsFromPeople(fallbackPeople);

const fallbackChartReadingStats: ChartReadingStats = {
  total: Math.max(214, fallbackChartReadings.length, bundledProvisionalCount),
  readable: fallbackChartReadings.filter((reading) => reading.reading_status === 'readable').length || 176,
  review: fallbackChartReadings.filter((reading) => reading.reading_status === 'review').length || 30,
  unclear: fallbackChartReadings.filter((reading) => reading.reading_status === 'unclear').length || 8,
  promoted: Math.max(214, fallbackChartReadings.length, bundledProvisionalCount),
};

const fallbackChartEdges: ChartEdge[] = [
  {
    id: -1,
    from_source_key: 'white-w007',
    to_source_key: 'white-w006',
    relation_type: 'lineage',
    reading_status: 'readable',
    confidence: 99,
    approval_status: 'pending_supervisor',
    source_locator: 'الفرع الأبيض - سلسلة المشهور',
  },
  {
    id: -2,
    from_source_key: 'white-w006',
    to_source_key: 'white-w021',
    relation_type: 'branch_founder',
    reading_status: 'readable',
    confidence: 99,
    approval_status: 'pending_supervisor',
    source_locator: 'الفرع الأبيض - ورقة محمد المشهور',
  },
  {
    id: -3,
    from_source_key: 'white-w009',
    to_source_key: 'white-w022',
    relation_type: 'branch_founder',
    reading_status: 'readable',
    confidence: 98,
    approval_status: 'pending_supervisor',
    source_locator: 'الفرع الأبيض - ورقة عبد الرحمن الشاطري',
  },
  {
    id: -4,
    from_source_key: 'blue-b007',
    to_source_key: 'blue-b025',
    relation_type: 'branch_founder',
    reading_status: 'readable',
    confidence: 96,
    approval_status: 'pending_supervisor',
    source_locator: 'الفرع الأزرق - ورقة سالم جد آل بن سهل والرويقي',
  },
  {
    id: -5,
    from_source_key: 'blue-b029',
    to_source_key: 'blue-b027',
    relation_type: 'branch_founder',
    reading_status: 'readable',
    confidence: 97,
    approval_status: 'pending_supervisor',
    source_locator: 'الفرع الأزرق - ورقة محمد البيض',
  },
  {
    id: -6,
    from_source_key: 'blue-b006',
    to_source_key: 'blue-b026',
    relation_type: 'branch_founder',
    reading_status: 'review',
    confidence: 82,
    approval_status: 'pending_supervisor',
    source_locator: 'الفرع الأزرق - ورقة محمد شريم',
  },
  {
    id: -7,
    from_source_key: 'blue-b020',
    to_source_key: 'blue-b026',
    relation_type: 'branch_founder',
    reading_status: 'review',
    confidence: 82,
    approval_status: 'pending_supervisor',
    source_locator: 'الفرع الأزرق - ورقة محمد شريم',
  },
];

const fallbackChartEdgeStats: ChartEdgeStats = {
  total: fallbackChartEdges.length,
  readable: fallbackChartEdges.filter((edge) => edge.reading_status === 'readable').length,
  review: fallbackChartEdges.filter((edge) => edge.reading_status === 'review').length,
  unclear: fallbackChartEdges.filter((edge) => edge.reading_status === 'unclear').length,
  confirmed: 0,
  pending_supervisor: fallbackChartEdges.length,
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

function pendingPeople(source: Person[]): Person[] {
  return source.filter((person) => person.approval_status === 'pending_supervisor' || person.is_provisional);
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

export async function getPendingPeople(): Promise<Person[]> {
  try {
    const result = await request<PaginatedPeople>('/people?per_page=250&approval_status=pending_supervisor');
    const remote = pendingPeople(result.data);
    const local = pendingPeople(fallbackPeople);
    return local.length > remote.length ? local : remote;
  } catch {
    return pendingPeople(fallbackPeople);
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

  try {
    const remote = (await request<PaginatedChartReadings>(`/chart-readings?${params.toString()}`)).data;
    const local = status
      ? fallbackChartReadings.filter((reading) => reading.reading_status === status)
      : fallbackChartReadings;
    return local.length > remote.length ? local : remote;
  } catch {
    return status
      ? fallbackChartReadings.filter((reading) => reading.reading_status === status)
      : fallbackChartReadings;
  }
}

export async function getChartReadingStats(): Promise<ChartReadingStats> {
  try {
    const stats = await request<ChartReadingStats>('/chart-readings-stats');
    return stats.total < fallbackChartReadingStats.total ? fallbackChartReadingStats : stats;
  } catch {
    return fallbackChartReadingStats;
  }
}

export async function getChartEdges(): Promise<ChartEdge[]> {
  try {
    const result = await request<ChartEdgeResponse>('/chart-edges?per_page=250');
    return result.data.length >= fallbackChartEdges.length ? result.data : fallbackChartEdges;
  } catch {
    return fallbackChartEdges;
  }
}

export async function getChartEdgeStats(): Promise<ChartEdgeStats> {
  try {
    const stats = await request<ChartEdgeStats>('/chart-edges-stats');
    return stats.total >= fallbackChartEdgeStats.total ? stats : fallbackChartEdgeStats;
  } catch {
    return fallbackChartEdgeStats;
  }
}

export function submitReviewRequest(payload: ReviewRequestPayload): Promise<ReviewRequestResponse> {
  return request('/review-requests', { method: 'POST', body: payload });
}

export function getReviewRequestStatus(trackingCode: string): Promise<ReviewRequestStatus> {
  return request(`/review-requests/${encodeURIComponent(trackingCode.trim())}`);
}
