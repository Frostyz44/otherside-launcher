export type ExperienceStatus = 'Live' | 'Beta' | 'Coming Soon' | 'Development' | 'Offline';

export interface ExperienceData {
  name: string;
  slug: string;
  description: string;
  longDescription: string | null;
  status: ExperienceStatus;
  type: string;
  developer: { name: string; logoUrl: string | null } | null;
  imageUrl: string | null;
  bannerImageUrl: string | null;
  currentPlayers: number | null;
  peak24hPlayers: number | null;
  features: string[] | null;
  playUrl: string | null;
  trailerUrl: string | null;
  isFeatured: boolean;
}

export interface ExperiencesResponse {
  success: boolean;
  data: ExperienceData[];
}

export interface TrendingCollection {
  name: string;
  slug: string;
  image: string | null;
  floor: number | null;
  listed: number;
  supply: number | null;
  volume24h: number;
  volume7d: number;
  change24h: number | null;
  change7d: number | null;
  sparkline?: (number | null)[];
  sales24h: number;
}

export type NavPage = 'home' | 'experiences' | 'market' | 'shop' | 'settings';

export interface LastPlayed {
  slug: string;
  name: string;
  imageUrl: string | null;
  playedAt: number;
}

export interface Settings {
  minimizeToTray: boolean;
  launchAtStartup: boolean;
  notifications: boolean;
}
