import { useSyncExternalStore } from 'react';
import { API_URL } from './api';

let adminToken: string | null = null;
const subscriptions = new Set<() => void>();
const subscribe = (listener: () => void) => {
  subscriptions.add(listener);
  return () => { subscriptions.delete(listener); };
};
const getSnapshot = () => adminToken !== null;

function setToken(next: string | null) {
  adminToken = next;
  subscriptions.forEach((listener) => listener());
}

export function useAdminSession(): boolean {
  return useSyncExternalStore(subscribe, getSnapshot, () => false);
}

export function adminHeaders(): Record<string, string> {
  if (!adminToken) throw new Error('هذه العملية مخصصة للإدارة. سجّل الدخول من «حول التطبيق» ← «الإدارة».');
  return { Authorization: 'Bearer ' + adminToken };
}

async function adminRequest(path: string, method = 'GET', body?: object): Promise<Record<string, unknown>> {
  const token = adminHeaders();
  const response = await fetch(API_URL + path, {
    method,
    headers: { Accept: 'application/json', 'Content-Type': 'application/json', ...token },
    body: body ? JSON.stringify(body) : undefined,
  });
  const result = await response.json().catch(() => ({})) as Record<string, unknown>;
  if (response.status === 401) setToken(null);
  if (!response.ok) {
    const errors = result.errors as Record<string, string[]> | undefined;
    throw new Error(errors ? Object.values(errors).flat().join('\n') : String(result.message || 'تعذر إتمام طلب الإدارة.'));
  }
  return result;
}

export async function loginAdmin(username: string, password: string): Promise<void> {
  const response = await fetch(API_URL + '/admin/login', {
    method: 'POST',
    headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: username.trim(), password }),
  });
  const result = await response.json().catch(() => ({})) as Record<string, unknown>;
  if (!response.ok || typeof result.token !== 'string') {
    const errors = result.errors as Record<string, string[]> | undefined;
    throw new Error(errors ? Object.values(errors).flat()[0] : String(result.message || 'بيانات الدخول غير صحيحة.'));
  }
  setToken(result.token);
}

export async function verifyAdminSession(): Promise<boolean> {
  if (!adminToken) return false;
  try { await adminRequest('/admin/me'); return true; }
  catch { setToken(null); return false; }
}

export async function logoutAdmin(): Promise<void> {
  if (!adminToken) return;
  try { await adminRequest('/admin/logout', 'POST'); }
  finally { setToken(null); }
}

export async function changeAdminPassword(current_password: string, new_password: string): Promise<void> {
  await adminRequest('/admin/change-password', 'POST', { current_password, new_password });
  setToken(null);
}
