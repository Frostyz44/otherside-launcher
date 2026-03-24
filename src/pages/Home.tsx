import { useState, useEffect, useRef } from 'react';
import { openUrl } from '@tauri-apps/plugin-opener';
import { fetchExperiences } from '../api';
import type { ExperienceData } from '../types';
import { sfxLaunch, sfxSlide, sfxClick } from '../sounds';
const CDN = 'https://cdn.oswiki.xyz/videos';

const SLUG_VIDEOS: Record<string, string> = {
  'nexus': `${CDN}/Nexus-Trailer.mp4`,
  'bathroom-blitz': `${CDN}/bathroom-blitz.mp4`,
  'meetropolis': `${CDN}/meetropolis.mp4`,
  'the-swamp': `${CDN}/swamp.mp4`,
  'vibe-maker': `${CDN}/vibemaker.mp4`,
};

const TRAILER_EMBED = 'https://www.youtube.com/embed/qt1equGhkQE?autoplay=1&rel=0&modestbranding=1&color=white';

const PATCH_URL = 'https://docs.otherside.xyz/documentation/continuous-development';

// Featured order — slugs matched against API data, fallback used if slug not found
const FEATURED_SLUGS = ['otherside', 'nexus', 'bathroom-blitz', 'vibe-maker', 'the-swamp', 'flingers'];

const PATCHES = [
  {
    id: 1, version: '2026.03.19',
    bullets: ['Mega Koda room open to all Kodas & Mega Kodas', 'Chaos Particle minigame + daily tasks', 'New Koda Cam badges', 'Challenge leaderboard reset'],
  },
  {
    id: 2, version: '2026.02.05',
    bullets: ['New multiplayer & single-player challenges', 'Player HUD keybind hints', '10 new daily tasks · 7 new badges', 'Player position coords on Map overlay'],
  },
  {
    id: 3, version: '2025.12.11',
    bullets: ['KodaCam introduced', '3 new single-player challenges', 'Map function (bind: Tab)', 'Replay "A Spark Reborn" any time'],
  },
];

const EVENTS = [
  { id: 1, name: 'Mutant MockTail',        date: new Date('2026-03-24T02:00:00Z'), recurrence: 'Weekly' },
  { id: 2, name: 'The Render Pool',         date: new Date('2026-03-24T20:00:00Z'), recurrence: 'Weekly' },
  { id: 3, name: 'Chimpers Game Day',       date: new Date('2026-03-24T20:00:00Z'), recurrence: 'Bi-weekly' },
  { id: 4, name: 'CHAOS TRIALS',            date: new Date('2026-03-25T02:00:00Z'), recurrence: 'Weekly' },
  { id: 5, name: 'Game Time with Jay B',    date: new Date('2026-03-25T18:00:00Z'), recurrence: 'Weekly' },
  { id: 6, name: 'FLINGERS: Game Night',    date: new Date('2026-03-25T20:00:00Z'), recurrence: 'Weekly' },
  { id: 7, name: 'Meet At The Club House',  date: new Date('2026-03-27T00:00:00Z'), recurrence: 'Weekly' },
];

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

function fmtDate(d: Date) {
  return `${MONTHS[d.getMonth()]} ${d.getDate()}`;
}

function fmtTime(d: Date) {
  const h = d.getHours();
  const m = d.getMinutes();
  const ampm = h >= 12 ? 'pm' : 'am';
  const h12 = h % 12 || 12;
  return `${h12}${m ? ':' + String(m).padStart(2, '0') : ''}${ampm}`;
}

function EventChip({ event }: { event: typeof EVENTS[0] }) {
  return (
    <div className="ev-chip">
      <span className="ev-date">{fmtDate(event.date)}</span>
      <span className="ev-time">{fmtTime(event.date)}</span>
      <span className="ev-name">{event.name}</span>
    </div>
  );
}

function ParticleBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    let animId: number;
    const particles: { x: number; y: number; vx: number; vy: number; size: number; opacity: number }[] = [];
    function resize() {
      if (!canvas) return;
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    }
    resize();
    window.addEventListener('resize', resize);
    for (let i = 0; i < 50; i++) {
      particles.push({
        x: Math.random() * canvas.width, y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.25, vy: (Math.random() - 0.5) * 0.25,
        size: Math.random() * 1.2 + 0.4, opacity: Math.random() * 0.3 + 0.05,
      });
    }
    function draw() {
      if (!canvas || !ctx) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const d = Math.sqrt(dx*dx + dy*dy);
          if (d < 90) {
            ctx.beginPath();
            ctx.strokeStyle = `rgba(200,155,60,${0.06*(1-d/90)})`;
            ctx.lineWidth = 0.5;
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.stroke();
          }
        }
      }
      for (const p of particles) {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI*2);
        ctx.fillStyle = `rgba(200,155,60,${p.opacity})`;
        ctx.fill();
        p.x += p.vx; p.y += p.vy;
        if (p.x < 0 || p.x > canvas.width) p.vx *= -1;
        if (p.y < 0 || p.y > canvas.height) p.vy *= -1;
      }
      animId = requestAnimationFrame(draw);
    }
    draw();
    return () => { cancelAnimationFrame(animId); window.removeEventListener('resize', resize); };
  }, []);
  return <canvas ref={canvasRef} className="particle-canvas" />;
}

export default function Home() {
  const [experiences, setExperiences] = useState<ExperienceData[]>([]);
  const [idx, setIdx] = useState(0);
  const [prevIdx, setPrevIdx] = useState(0);
  const [trailerOpen, setTrailerOpen] = useState(false);
  const [muted, setMuted] = useState(true);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    fetchExperiences({ sortBy: 'sort_order', sortDirection: 'asc' })
      .then(res => setExperiences(res.data))
      .catch(() => {});
  }, []);

  // Build featured list: defined slugs first (in order), then all remaining active experiences
  const featured = (() => {
    const active = experiences.filter(e => e.status !== 'Offline');
    const ordered: ExperienceData[] = [];
    for (const slug of FEATURED_SLUGS) {
      const match = active.find(e => e.slug === slug);
      if (match) ordered.push(match);
    }
    for (const e of active) {
      if (!ordered.find(o => o.slug === e.slug)) ordered.push(e);
    }
    return ordered;
  })();

  useEffect(() => { setIdx(0); setPrevIdx(0); }, [featured.length]);

  const startAutoPlay = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    if (featured.length <= 1) return;
    intervalRef.current = setInterval(() => {
      setIdx(cur => {
        const next = (cur + 1) % featured.length;
        setPrevIdx(cur);
        return next;
      });
    }, 15000);
  };

  useEffect(() => {
    startAutoPlay();
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [featured.length]);

  function goTo(next: number) {
    if (next === idx) return;
    sfxSlide();
    if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null; }
    setPrevIdx(idx);
    setIdx(next);
  }

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setTrailerOpen(false);
    }
    if (trailerOpen) window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [trailerOpen]);

  useEffect(() => {
    function onArrow(e: KeyboardEvent) {
      if (trailerOpen || featured.length <= 1) return;
      if (e.key === 'ArrowRight') {
        goTo((idx + 1) % featured.length);
      } else if (e.key === 'ArrowLeft') {
        goTo((idx - 1 + featured.length) % featured.length);
      }
    }
    window.addEventListener('keydown', onArrow);
    return () => window.removeEventListener('keydown', onArrow);
  }, [idx, featured.length, trailerOpen]);

  const exp = featured[idx] ?? null;
  const prevExp = featured[prevIdx] ?? null;
  const heroVideo = exp?.slug ? (SLUG_VIDEOS[exp.slug] ?? null) : null;
  const prevHeroVideo = prevExp?.slug ? (SLUG_VIDEOS[prevExp.slug] ?? null) : null;
  const heroImage = exp?.bannerImageUrl ?? exp?.imageUrl ?? null;
  const prevHeroImage = prevExp?.bannerImageUrl ?? prevExp?.imageUrl ?? null;
  const canLaunch = !!exp?.playUrl && exp?.status !== 'Offline' && exp?.status !== 'Development';

  async function handleLaunch() {
    if (!exp?.playUrl) return;
    sfxLaunch();
    try { await openUrl(exp.playUrl); } catch { window.open(exp.playUrl, '_blank'); }
  }

  function openLink(url: string) {
    try { window.__TAURI_INTERNALS__?.invoke('plugin:opener|open_url', { url }); }
    catch { window.open(url, '_blank'); }
  }

  return (
    <div className="home-fullscreen">

      {/* Trailer modal */}
      {trailerOpen && (
        <div className="trailer-modal-overlay" onClick={() => setTrailerOpen(false)}>
          <div className="trailer-modal-box" onClick={e => e.stopPropagation()}>
            <button className="trailer-modal-close" onClick={() => setTrailerOpen(false)}>✕</button>
            <iframe
              src={TRAILER_EMBED}
              className="trailer-modal-iframe"
              allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
              allowFullScreen
              title="Otherside Trailer"
            />
          </div>
        </div>
      )}

      {/* Hero — fills everything, all content overlaid */}
      <div className="hero-wrap">
        <ParticleBackground />
        {/* Crossfade: prev stays beneath, next fades in on top */}
        {prevHeroVideo
          ? <video src={prevHeroVideo} className="hero-video-bg hero-bg-prev" autoPlay loop muted playsInline preload="metadata" />
          : prevHeroImage ? <img src={prevHeroImage} alt="" className="hero-video-bg hero-bg-prev" /> : null}
        {heroVideo
          ? <video ref={videoRef} key={`v-${idx}`} src={heroVideo} className="hero-video-bg hero-bg-next" autoPlay loop muted={muted} playsInline preload="metadata" />
          : heroImage ? <img src={heroImage} alt={exp?.name ?? ''} key={`i-${idx}`} className="hero-video-bg hero-bg-next" /> : null}
        <div className="hero-overlay" />

        {/* Bottom-left: title + buttons */}
        <div className="hero-left">
          {exp ? (
            <>
              <h1 className="hero-title">
                {exp.developer && (
                  exp.developer.logoUrl
                    ? <img src={exp.developer.logoUrl} alt={exp.developer.name} className="hero-dev-logo" />
                    : <span className="hero-dev-tag">{exp.developer.name}</span>
                )}
                {exp.name}
              </h1>
              <p className="hero-desc">{exp.longDescription ?? exp.description}</p>
              <div className="hero-btns">
                <button className="btn-play" disabled={!canLaunch} onClick={handleLaunch}>
                  {canLaunch ? '▶  Launch' : exp.status}
                </button>
                <button className="btn-ghost" onClick={() => { sfxClick(); setTrailerOpen(true); }}>
                  ▶ Watch Trailer
                </button>
              </div>
            </>
          ) : (
            <>
              <h1 className="hero-title">The Otherside</h1>
              <p className="hero-desc">A gamified, interoperable metaverse. Your NFTs come to life.</p>
              <div className="hero-btns">
                <button className="btn-ghost" onClick={() => setTrailerOpen(true)}>▶ Watch Trailer</button>
              </div>
            </>
          )}
        </div>

        {/* Bottom strip: upcoming events ticker */}
        <div className="hero-events">
          <div className="hero-events-label">
            <span className="hero-events-label-text">Upcoming</span>
          </div>
          <div className="hero-events-ticker">
            <div className="hero-events-track">
              {[...EVENTS, ...EVENTS].map((e, i) => (
                <EventChip key={i} event={e} />
              ))}
            </div>
          </div>
        </div>

        {/* Bottom-right: patch note cards */}
        <div className="hero-patches">
          <div className="hero-patches-head">
            <span className="hero-patches-label">Patch Notes</span>
            <span className="hero-patches-more" onClick={() => openLink(PATCH_URL)}>See all ↗</span>
          </div>
          <div className="hero-patches-cards">
            {PATCHES.map(p => (
              <div key={p.id} className="patch-card" onClick={() => openLink(PATCH_URL)}>
                <div className="patch-card-ver">{p.version}</div>
                <ul className="patch-card-list">
                  {p.bullets.slice(0, 3).map((b, i) => <li key={i}>{b}</li>)}
                </ul>
              </div>
            ))}
          </div>
        </div>

        {featured.length > 1 && (
          <div className="hero-tabs">
            {featured.map((_, i) => (
              <button key={i} className={`hero-tab${i === idx ? ' active' : ''}`} onClick={() => goTo(i)} />
            ))}
          </div>
        )}

        {heroVideo && (
          <button className="hero-mute-btn" onClick={() => setMuted(m => !m)} title={muted ? 'Unmute' : 'Mute'}>
            {muted
              ? <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><line x1="23" y1="9" x2="17" y2="15"/><line x1="17" y1="9" x2="23" y2="15"/></svg>
              : <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/></svg>
            }
          </button>
        )}
      </div>
    </div>
  );
}

declare global {
  interface Window {
    __TAURI_INTERNALS__?: {
      invoke: (cmd: string, args?: Record<string, unknown>) => Promise<unknown>;
    };
  }
}
