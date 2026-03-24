import type { ExperiencesResponse, ExperienceStatus, TrendingCollection } from './types';

const API_BASE = 'https://api.oswiki.xyz';

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
  const res = await fetch(`${API_BASE}/experiences${qs ? `?${qs}` : ''}`);
  if (!res.ok) throw new Error(`API error ${res.status}`);
  return res.json();
}

export async function fetchTrending(): Promise<TrendingCollection[]> {
  const res = await fetch(`${API_BASE}/collections/trending`);
  if (!res.ok) throw new Error(`API error ${res.status}`);
  const json = await res.json();
  return json.data ?? [];
}
