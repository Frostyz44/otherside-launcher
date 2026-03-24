import { useState, useEffect } from 'react';
import { fetchTrending } from '../api';
import type { TrendingCollection } from '../types';

const COLLECTION_SLUGS = ['otherdeed', 'koda', 'hv-mtl', 'mara', 'kodamara', 'vessel', 'catalyst', 'relics'];

function formatEth(val: number | null): string {
  if (val === null) return '—';
  return `Ξ ${val.toFixed(3)}`;
}

function formatChange(val: number | null): { text: string; positive: boolean } {
  if (val === null) return { text: '—', positive: false };
  const sign = val >= 0 ? '+' : '';
  return { text: `${sign}${val.toFixed(1)}%`, positive: val >= 0 };
}

function Sparkline({ values }: { values: (number | null)[] }) {
  const valid = values.filter((v): v is number => v !== null);
  if (valid.length < 2) return <span className="spark-empty">—</span>;

  const min = Math.min(...valid);
  const max = Math.max(...valid);
  const range = max - min || 1;
  const w = 64;
  const h = 24;
  const points = values
    .map((v, i) => {
      const x = (i / (values.length - 1)) * w;
      const y = h - ((( v ?? min) - min) / range) * h;
      return `${x},${y}`;
    })
    .join(' ');

  const isUp = valid[valid.length - 1] >= valid[0];

  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} className="spark">
      <polyline points={points} fill="none" stroke={isUp ? '#22c55e' : '#ef4444'} strokeWidth="1.5" />
    </svg>
  );
}

export default function Market() {
  const [collections, setCollections] = useState<TrendingCollection[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  function load() {
    setLoading(true);
    setError(null);
    fetchTrending()
      .then(data => setCollections(data.filter(c => COLLECTION_SLUGS.includes(c.slug))))
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }

  useEffect(() => { load(); }, []);

  return (
    <div className="market-page">
      <div className="page-header">
        <h1 className="page-title">Market</h1>
        <button className="icon-btn" onClick={load} title="Refresh">↻</button>
      </div>

      <div className="page-scroll" style={{ flex: 1, overflowY: 'auto', padding: 16 }}>
        {loading && <div className="state-center"><div className="spinner" /><p>Loading...</p></div>}
        {error && <div className="state-center"><p className="error-text">Failed to load</p><button className="retry-btn" onClick={load}>Retry</button></div>}

        {!loading && !error && (
          <div className="market-table">
            <div className="market-header">
              <span>Collection</span>
              <span>Floor</span>
              <span>24h</span>
              <span>Vol 24h</span>
              <span>Listed</span>
              <span>7d</span>
            </div>
            {collections.map(col => {
              const change24 = formatChange(col.change24h);
              return (
                <div key={col.slug} className="market-row">
                  <div className="market-name">
                    {col.image
                      ? <img src={col.image} alt={col.name} className="market-img" />
                      : <div className="market-img-placeholder">{col.name[0]}</div>
                    }
                    <span>{col.name}</span>
                  </div>
                  <span className="market-val">{formatEth(col.floor)}</span>
                  <span className={`market-change ${change24.positive ? 'positive' : 'negative'}`}>
                    {change24.text}
                  </span>
                  <span className="market-val">{formatEth(col.volume24h)}</span>
                  <span className="market-muted">{col.listed.toLocaleString()}</span>
                  <Sparkline values={col.sparkline ?? []} />
                </div>
              );
            })}
          </div>
        )}

        <div className="market-link-row">
          <a href="https://oswiki.xyz" target="_blank" rel="noreferrer" className="market-link">
            View full market on OSWiki →
          </a>
        </div>
      </div>
    </div>
  );
}
