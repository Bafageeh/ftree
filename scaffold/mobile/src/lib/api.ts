import Constants from 'expo-constants';

import type { LineageResponse, PaginatedPeople, Person, Stats } from '../types';

const configuredUrl = process.env.EXPO_PUBLIC_API_URL
  ?? Constants.expoConfig?.extra?.apiUrl
  ?? 'https://shajara.pm.sa/api/v1';

export const API_URL = String(configuredUrl).replace(/\/$/, '');

const fallbackPeople: Person[] = [
  ['محمد ﷺ', 'رسول الله ﷺ', null, 'readable'],
  ['فاطمة الزهراء', 'رضي الله عنها', 1, 'readable'],
  ['الحسين السبط', 'رضي الله عنه', 2, 'readable'],
  ['علي زين العابدين', null, 3, 'readable'],
  ['محمد الباقر', null, 4, 'readable'],
  ['جعفر الصادق', null, 5, 'readable'],
  ['علي العريضي', null, 6, 'review'],
  ['محمد النقيب', null, 7, 'review'],
  ['عيسى النقيب', null, 8, 'review'],
  ['أحمد المهاجر', null, 9, 'readable'],
  ['عبيد الله', null, 10, 'review'],
  ['علوي', null, 11, 'review'],
  ['محمد', null, 12, 'review'],
  ['علوي', null, 13, 'review'],
  ['علي خالع قسم', null, 14, 'review'],
  ['محمد صاحب مرباط', null, 15, 'review'],
].map(([full_name, honorific, lineage_parent_id, status], index) => ({
  id: index + 1,
  full_name: String(full_name),
  honorific: honorific ? String(honorific) : null,
  lineage_parent_id: lineage_parent_id ? Number(lineage_parent_id) : null,
  status: status as Person['status'],
  generation: index + 1,
  summary: 'بيان أولي يحتاج إلى المطابقة مع المشجرة والمصادر المعتمدة.',
  source_reference: 'المشجرة الأصلية',
  is_living: false,
}));

async function request<T>(path: string): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 8000);

  try {
    const response = await fetch(`${API_URL}${path}`, {
      headers: { Accept: 'application/json' },
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new Error(`API request failed with ${response.status}`);
    }

    return await response.json() as T;
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
      generations: fallbackPeople.length,
    };
  }
}

export async function getLineage(id: number): Promise<LineageResponse> {
  try {
    return await request<LineageResponse>(`/people/${id}/lineage`);
  } catch {
    const path = fallbackPeople.filter((person) => person.id <= id);
    const person = fallbackPeople.find((item) => item.id === id) ?? fallbackPeople[0];
    return {
      person,
      path,
      path_text: path.map((item) => item.full_name).join(' ← '),
    };
  }
}
