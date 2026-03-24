import { useState, useEffect, useCallback } from 'react';
import { openUrl } from '@tauri-apps/plugin-opener';
import { Search } from 'lucide-react';
import { sfxLaunch, sfxClick, sfxHover } from '../sounds';
import { fetchExperiences } from '../api';
import type { ExperienceData, ExperienceStatus, LastPlayed } from '../types';

const STATUS_LABEL: Record<ExperienceStatus, string> = {
  Live: 'Live', Beta: 'Beta', 'Coming Soon': 'Soon', Development: 'Dev', Offline: 'Offline',
};
const STATUS_COLOR: Record<ExperienceStatus, string> = {
  Live: '#22c55e', Beta: '#3b82f6', 'Coming Soon': '#f59e0b', Development: '#8b5cf6', Offline: '#6b7280',
};

const LAST_PLAYED_KEY = 'oswiki_last_played';

function getLastPlayed(): LastPlayed[] {
  try { return JSON.parse(localStorage.getItem(LAST_PLAYED_KEY) ?? '[]'); }
  catch { return []; }
}
function addLastPlayed(exp: ExperienceData) {
  const existing = getLastPlayed().filter(e => e.slug !== exp.slug);
  const updated: LastPlayed[] = [
    { slug: exp.slug, name: exp.name, imageUrl: exp.bannerImageUrl ?? exp.imageUrl, playedAt: Date.now() },
    ...existing,
  ].slice(0, 6);
  localStorage.setItem(LAST_PLAYED_KEY, JSON.stringify(updated));
}

function ExperienceCard({ exp, onLaunch }: { exp: ExperienceData; onLaunch: (e: ExperienceData) => void }) {
  const image = exp.bannerImageUrl ?? exp.imageUrl;
  const canLaunch = !!exp.playUrl && exp.status !== 'Offline' && exp.status !== 'Development';
  const c = STATUS_COLOR[exp.status];

  return (
    <div className="xp-card" onMouseEnter={sfxHover} onClick={() => canLaunch && onLaunch(exp)}>
      {image
        ? <img src={image} alt={exp.name} loading="lazy" className="xp-card-img" />
        : <div className="xp-card-ph">{exp.name[0]}</div>
      }
      <div className="xp-card-grad" />
      <span className="xp-badge" style={{ color: c, borderColor: c + '55', background: c + '18' }}>
        {exp.status === 'Live' && <span className="xp-badge-dot" style={{ background: c }} />}
        {STATUS_LABEL[exp.status]}
      </span>
      <div className="xp-card-foot">
        <div className="xp-card-name">{exp.name}</div>
        {exp.developer && <div className="xp-card-dev">{exp.developer.name}</div>}
        <button
          className={`xp-launch${canLaunch ? '' : ' xp-launch-off'}`}
          disabled={!canLaunch}
          onClick={e => { e.stopPropagation(); canLaunch && onLaunch(exp); }}
        >
          {canLaunch ? '▶  Launch' : exp.status}
        </button>
      </div>
    </div>
  );
}

function LastPlayedCard({ item, onLaunch }: { item: LastPlayed; onLaunch: (slug: string) => void }) {
  return (
    <div className="lp-card" onClick={() => onLaunch(item.slug)}>
      {item.imageUrl
        ? <img src={item.imageUrl} alt={item.name} />
        : <div className="lp-ph">{item.name[0]}</div>
      }
      <div className="lp-grad" />
      <div className="lp-foot">
        <span className="lp-name">{item.name}</span>
        <span className="lp-play">▶ Continue</span>
      </div>
    </div>
  );
}

type Filter = 'all' | 'live' | 'coming' | 'featured';
const TABS: { id: Filter; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'live', label: 'Live' },
  { id: 'coming', label: 'Coming Soon' },
  { id: 'featured', label: 'Featured' },
];

export default function Experiences() {
  const [experiences, setExperiences] = useState<ExperienceData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<Filter>('all');
  const [lastPlayed, setLastPlayed] = useState<LastPlayed[]>(getLastPlayed());

  const load = useCallback((s?: string, f?: Filter) => {
    const ff = f ?? filter;
    setLoading(true); setError(null);
    fetchExperiences({
      search: s || undefined,
      status: ff === 'live' ? 'Live' : ff === 'coming' ? 'Coming Soon' : undefined,
      featured: ff === 'featured' ? true : undefined,
      sortBy: 'current_players', sortDirection: 'desc',
    })
      .then(res => setExperiences(res.data))
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, [filter]);

  useEffect(() => { load(); }, []);
  useEffect(() => { const t = setTimeout(() => load(search), 300); return () => clearTimeout(t); }, [search]);

  async function handleLaunch(exp: ExperienceData) {
    if (!exp.playUrl) return;
    sfxLaunch();
    addLastPlayed(exp); setLastPlayed(getLastPlayed());
    try { await openUrl(exp.playUrl); } catch { window.open(exp.playUrl, '_blank'); }
  }
  function handleLPLaunch(slug: string) {
    const e = experiences.find(x => x.slug === slug);
    if (e) handleLaunch(e);
  }
  function changeFilter(f: Filter) { sfxClick(); setFilter(f); load(search, f); }

  return (
    <div className="xp-page">
      <div className="xp-bar">
        <div className="xp-search-wrap">
          <Search size={13} className="xp-search-icon" />
          <input className="xp-search" placeholder="Search..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <div className="xp-filters">
          {TABS.map(t => (
            <button key={t.id} className={`xp-filter${filter === t.id ? ' active' : ''}`} onClick={() => changeFilter(t.id)}>
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div className="xp-scroll">
        <section className="xp-section">
          <h2 className="xp-label">Experiences</h2>
          {loading && <div className="xp-state"><div className="xp-spinner" /></div>}
          {error && <div className="xp-state"><p style={{ color: '#f87171' }}>Failed to load</p><button className="xp-retry" onClick={() => load(search)}>Retry</button></div>}
          {!loading && !error && experiences.length === 0 && <div className="xp-state"><p>No experiences found</p></div>}
          {!loading && !error && experiences.length > 0 && (
            <div className="xp-grid">
              {experiences.map(exp => <ExperienceCard key={exp.slug} exp={exp} onLaunch={handleLaunch} />)}
            </div>
          )}
        </section>

        {lastPlayed.length > 0 && (
          <section className="xp-section xp-section-lp">
            <h2 className="xp-label">Continue Playing</h2>
            <div className="lp-strip">
              {lastPlayed.map(item => <LastPlayedCard key={item.slug} item={item} onLaunch={handleLPLaunch} />)}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
