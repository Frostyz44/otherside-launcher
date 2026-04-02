import type { ExperiencesResponse, ExperienceStatus, TrendingCollection } from './types';

const API_BASE = 'https://api.oswiki.xyz';
const AUTH_KEY = 'oswiki_auth';

function getToken(): string | null {
  try {
    const auth = JSON.parse(localStorage.getItem(AUTH_KEY) ?? '{}');
    return auth.token ?? null;
  } catch {
    return null;
  }
}

function authHeaders(): Record<string, string> {
  const token = getToken();
  if (!token) return {};
  return { Authorization: `Bearer ${token}` };
}

/** Clear auth and reload so the user lands on the login screen. */
function expireSession() {
  localStorage.removeItem(AUTH_KEY);
  window.location.reload();
}

/** Shared fetch wrapper — auto-logs out on 401 (expired token). */
async function apiFetch(url: string, init?: RequestInit): Promise<Response> {
  const res = await fetch(url, { ...init, headers: { ...authHeaders(), ...init?.headers } });
  if (res.status === 401) {
    expireSession();
    throw new Error('Session expired');
  }
  return res;
}

export interface ExperienceFilters {
  search?: string;
  status?: ExperienceStatus;
  type?: string;
  featured?: boolean;
  sortBy?: 'name' | 'status' | 'type' | 'developer' | 'current_players' | 'sort_order' | 'created_at';
  sortDirection?: 'asc' | 'desc';
}

export async function fetchExperiences(filters?: ExperienceFilters): Promise<ExperiencesResponse> {
  const params = new URLSearchParams();
  if (filters?.search) params.set('search', filters.search);
  if (filters?.status) params.set('status', filters.status);
  if (filters?.type) params.set('type', filters.type);
  if (filters?.featured !== undefined) params.set('featured', filters.featured ? '1' : '0');
  if (filters?.sortBy) params.set('sortBy', filters.sortBy);
  if (filters?.sortDirection) params.set('sortDirection', filters.sortDirection);
  const qs = params.toString();
  const res = await apiFetch(`${API_BASE}/experiences${qs ? `?${qs}` : ''}`);
  if (!res.ok) throw new Error(`API error ${res.status}`);
  return res.json();
}

export async function fetchProfile(address: string): Promise<{ username: string | null; picture: string | null } | null> {
  try {
    // Use plain fetch (not apiFetch) so a 401 here never triggers session expiration —
    // profile sync is non-critical; the user is already logged in.
    const token = getToken();
    const res = await fetch(`${API_BASE}/account/${address}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    if (!res.ok) return null;
    const json = await res.json();
    return { username: json.username ?? null, picture: json.picture ?? null };
  } catch {
    return null;
  }
}

export async function fetchTrending(): Promise<TrendingCollection[]> {
  const res = await apiFetch(`${API_BASE}/collections/trending`);
  if (!res.ok) throw new Error(`API error ${res.status}`);
  const json = await res.json();
  return json.data ?? [];
}

export interface PatchSection {
  heading: string;
  bullets: string[];
}

export interface PatchNote {
  version: string;
  bullets: string[];
  sections: PatchSection[];
}

export async function fetchPatchNotes(): Promise<PatchNote[]> {
  try {
    const res = await fetch(`${API_BASE}/otherside/patch-notes`);
    if (!res.ok) return [];
    return res.json();
  } catch {
    return [];
  }
}
