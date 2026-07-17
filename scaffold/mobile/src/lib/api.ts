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
const PROPHET_SOURCE_CODE = 'CORE-001';

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

function connectedPeopleOnly(source: Person[]): Person[] {
  const active = source.filter((person) => person.approval_status !== 'rejected');
  const byId = new Map(active.map((person) => [person.id, person]));
  const cache = new Map<number, boolean>();

  const connected = (person: Person): boolean => {
    if (cache.has(person.id)) return cache.get(person.id) as boolean;

    const visited = new Set<number>();
    let current: Person | undefined = person;

    while (current && !visited.has(current.id)) {
      if (cache.has(current.id)) {
        const result = cache.get(current.id) as boolean;
        visited.forEach((id) => cache.set(id, result));
        return result;
      }

      visited.add(current.id);
      if (current.source_code === PROPHET_SOURCE_CODE) {
        visited.forEach((id) => cache.set(id, true));
        return true;
      }

      if (!current.lineage_parent_id) {
        visited.forEach((id) => cache.set(id, false));
        return false;
      }

      current = byId.get(current.lineage_parent_id);
    }

    visited.forEach((id) => cache.set(id, false));
    return false;
  };

  return active.filter(connected);
}

const fallbackSource = bundledPeople.length > coreFallback.length ? bundledPeople : coreFallback;
const fallbackPeople = connectedPeopleOnly(fallbackSource);
const bundledProvisionalCount = fallbackPeople.filter((person) => person.is_provisional).length;

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
  total: fallbackChartReadings.length,
  readable: fallbackChartReadings.filter((reading) => reading.reading_status === 'readable').length,
  review: fallbackChartReadings.filter((reading) => reading.reading_status === 'review').length,
  unclear: fallbackChartReadings.filter((reading) => reading.reading_status === 'unclear').length,
  promoted: Math.max(fallbackChartReadings.length, bundledProvisionalCount),
};

const rawFallbackChartEdges: ChartEdge[] = [
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

function filterChartReadingsByPeople(readings: ChartReading[], people: Person[]): ChartReading[] {
  const ids = new Set(people.map((person) => person.id));
  const codes = new Set(people.map((person) => person.source_code).filter((code): code is string => !!code));

  return readings.filter((reading) =>
    (reading.person_id != null && ids.has(reading.person_id)) || codes.has(reading.source_key),
  );
}

function filterChartEdgesByPeople(edges: ChartEdge[], people: Person[]): ChartEdge[] {
  const codes = new Set(people.map((person) => person.source_code).filter((code): code is string => !!code));
  return edges.filter((edge) => codes.has(edge.from_source_key) && codes.has(edge.to_source_key));
}

const fallbackChartEdges = filterChartEdgesByPeople(rawFallbackChartEdges, fallbackPeople);
const fallbackChartEdgeStats: ChartEdgeStats = {
  total: fallbackChartEdges.length,
  readable: fallbackChartEdges.filter((edge) => edge.reading_status === 'readable').length,
  review: fallbackChartEdges.filter((edge) => edge.reading_status === 'review').length,
  unclear: fallbackChartEdges.filter((edge) => edge.reading_status === 'unclear').length,
  confirmed: fallbackChartEdges.filter((edge) => edge.approval_status === 'supervisor_confirmed').length,
  pending_supervisor: fallbackChartEdges.filter((edge) => edge.approval_status === 'pending_supervisor').length,
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
  const confirmed = source.filter((person) => person.approval_status === 'supervisor_confirmed' && !person.is_provisional).length;
  const pending = source.filter((person) => person.approval_status === 'pending_supervisor' || person.is_provisional).length;

  return {
    total: source.length,
    connected_to_prophet: source.length,
    connected_to_prophet_confirmed: confirmed,
    connected_to_prophet_pending_review: pending,
    disconnected_from_prophet: 0,
    confirmed,
    pending_supervisor: pending,
    readable: source.filter((person) => person.status === 'readable').length,
    review: source.filter((person) => person.status === 'review').length,
    unclear: source.filter((person) => person.status === 'unclear').length,
    generations,
    branches: new Set(source.map((person) => person.chart_branch).filter(Boolean)).size,
  };
}

export async function getPeople(search = '', status = ''): Promise<Person[]> {
  try {
    const result = await request<PaginatedPeople>('/people?per_page=250&lineage_status=connected');
    return filterPeople(connectedPeopleOnly(result.data), search, status);
  } catch {
    return filterPeople(fallbackPeople, search, status);
  }
}

export async function getPendingPeople(): Promise<Person[]> {
  try {
    const result = await request<PaginatedPeople>('/people?per_page=250&lineage_status=connected&approval_status=pending_supervisor');
    return pendingPeople(connectedPeopleOnly(result.data));
  } catch {
    return pendingPeople(fallbackPeople);
  }
}

export async function getStats(): Promise<Stats> {
  try {
    const stats = await request<Stats>('/stats');
    return { ...stats, disconnected_from_prophet: 0 };
  } catch {
    return statsFromPeople(fallbackPeople);
  }
}

export async function getLineage(id: number): Promise<LineageResponse> {
  try {
    const result = await request<LineageResponse>(`/people/${id}/lineage`);
    if (result.connected_to_prophet === false || result.path[0]?.source_code !== PROPHET_SOURCE_CODE) {
      throw new Error('هذا الاسم غير مرتبط بسيد البشر محمد ﷺ.');
    }
    return result;
  } catch {
    const byId = new Map(fallbackPeople.map((person) => [person.id, person]));
    const selected = byId.get(id);
    if (!selected) throw new Error('أُلغي هذا الاسم من العرض لأنه غير مرتبط بسيد البشر محمد ﷺ.');

    const path: Person[] = [];
    const visited = new Set<number>();
    let current: Person | undefined = selected;
    while (current && !visited.has(current.id)) {
      path.unshift(current);
      visited.add(current.id);
      current = current.lineage_parent_id ? byId.get(current.lineage_parent_id) : undefined;
    }

    if (path[0]?.source_code !== PROPHET_SOURCE_CODE) {
      throw new Error('أُلغي هذا الاسم من العرض لأنه غير مرتبط بسيد البشر محمد ﷺ.');
    }

    return {
      person: selected,
      connected_to_prophet: true,
      fully_confirmed: path.every((item) => item.approval_status === 'supervisor_confirmed'),
      pending_review_count: path.filter((item) => item.approval_status !== 'supervisor_confirmed').length,
      lineage_status: 'connected_to_prophet',
      prophet: path[0],
      path,
      path_text: path.map((item) => item.full_name).join(' ← '),
      display_path_text: path.map((item) => item.full_name).join(' ← '),
      relation_count: Math.max(path.length - 1, 0),
      cycle_detected: false,
    };
  }
}

export async function getChartReadings(status: ReadingStatus | '' = ''): Promise<ChartReading[]> {
  const params = new URLSearchParams({ per_page: '250' });
  if (status) params.set('status', status);

  try {
    const [remote, people] = await Promise.all([
      request<PaginatedChartReadings>(`/chart-readings?${params.toString()}`),
      getPeople(),
    ]);
    return filterChartReadingsByPeople(remote.data, people);
  } catch {
    return status
      ? fallbackChartReadings.filter((reading) => reading.reading_status === status)
      : fallbackChartReadings;
  }
}

export async function getChartReadingStats(): Promise<ChartReadingStats> {
  try {
    const readings = await getChartReadings();
    return {
      total: readings.length,
      readable: readings.filter((reading) => reading.reading_status === 'readable').length,
      review: readings.filter((reading) => reading.reading_status === 'review').length,
      unclear: readings.filter((reading) => reading.reading_status === 'unclear').length,
      promoted: readings.filter((reading) => reading.is_promoted).length,
    };
  } catch {
    return fallbackChartReadingStats;
  }
}

export async function getChartEdges(): Promise<ChartEdge[]> {
  try {
    const [result, people] = await Promise.all([
      request<ChartEdgeResponse>('/chart-edges?per_page=250'),
      getPeople(),
    ]);
    return filterChartEdgesByPeople(result.data, people);
  } catch {
    return fallbackChartEdges;
  }
}

export async function getChartEdgeStats(): Promise<ChartEdgeStats> {
  try {
    const edges = await getChartEdges();
    return {
      total: edges.length,
      readable: edges.filter((edge) => edge.reading_status === 'readable').length,
      review: edges.filter((edge) => edge.reading_status === 'review').length,
      unclear: edges.filter((edge) => edge.reading_status === 'unclear').length,
      confirmed: edges.filter((edge) => edge.approval_status === 'supervisor_confirmed').length,
      pending_supervisor: edges.filter((edge) => edge.approval_status === 'pending_supervisor').length,
    };
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
