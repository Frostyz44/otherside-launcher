import { useState, useEffect, useRef, type RefObject } from 'react';
import { openUrl } from '@tauri-apps/plugin-opener';
import { invoke } from '@tauri-apps/api/core';
import { Tooltip } from '../components/Tooltip';
import { fetchExperiences } from '../api';
import type { ExperienceData } from '../types';
import { sfxLaunch, sfxSlide, sfxClick } from '../sounds';

const TZ_SHORT = Intl.DateTimeFormat('en', { timeZoneName: 'short' })
  .formatToParts(new Date())
  .find(p => p.type === 'timeZoneName')?.value ?? 'Local';
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

interface CalendarEvent {
  id: string;
  title: string;
  dateTime: string;
  recurrenceType: string;
  externalUrl: string | null;
  imageUrl: string | null;
}


function fmtRelative(d: Date): string {
  const diffMs = d.getTime() - Date.now();
  const diffMin = Math.round(diffMs / 60_000);
  if (diffMin < 0) return 'now';
  if (diffMin < 60) return `in ${diffMin}m`;
  const diffH = Math.floor(diffMin / 60);
  if (diffH < 24) return `in ${diffH}h`;
  const diffD = Math.floor(diffH / 24);
  if (diffD === 1) return 'tomorrow';
  if (diffD < 7) return `in ${diffD} days`;
  const diffW = Math.floor(diffD / 7);
  return diffW === 1 ? 'in 1 week' : `in ${diffW} weeks`;
}

function fmtLocalTime(d: Date): string {
  const h = d.getHours();
  const m = d.getMinutes();
  const ampm = h >= 12 ? 'pm' : 'am';
  const h12 = h % 12 || 12;
  return `${h12}${m ? ':' + String(m).padStart(2, '0') : ''}${ampm}`;
}


function EventChip({ event, onOpen }: { event: CalendarEvent; onOpen: (url: string) => void }) {
  const d = new Date(event.dateTime);
  const imgSrc = event.imageUrl ?? null;
  return (
    <Tooltip label={`${d.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })} · ${fmtLocalTime(d)} ${TZ_SHORT}`} side="top">
      <div
        className="ev-chip"
        onClick={() => event.externalUrl && onOpen(event.externalUrl)}
        style={{ cursor: event.externalUrl ? 'pointer' : 'default' }}
      >
        {imgSrc && <img className="ev-img" src={imgSrc} alt="" />}
        <span className="ev-name">{event.title}</span>
        <span className="ev-relative">{fmtRelative(d)}</span>
      </div>
    </Tooltip>
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

export default function Home({ bgMusic }: { bgMusic?: RefObject<HTMLAudioElement | null> }) {
  const [experiences, setExperiences] = useState<ExperienceData[]>([]);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const nextEvent = events[0] ?? null;
  const [idx, setIdx] = useState(0);
  const [prevIdx, setPrevIdx] = useState(0);
  const [trailerOpen, setTrailerOpen] = useState(false);
  const [muted, setMuted] = useState(true);
  const [volume, setVolume] = useState(0.3);
  const [sliderVisible, setSliderVisible] = useState(false);
  const sliderHideRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [videoProgress, setVideoProgress] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    fetchExperiences({ sortBy: 'sort_order', sortDirection: 'asc' })
      .then(res => setExperiences(res.data))
      .catch(() => {});
    const loadEvents = () =>
      invoke<CalendarEvent[]>('fetch_upcoming_events')
        .then(data => setEvents(data))
        .catch(err => console.error('fetch_upcoming_events:', err));
    loadEvents();
    const timer = setInterval(loadEvents, 5 * 60 * 1000);
    return () => clearInterval(timer);
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
          ? <video
              ref={el => { (videoRef as React.MutableRefObject<HTMLVideoElement | null>).current = el; if (el) el.volume = volume; }}
              key={`v-${idx}`} src={heroVideo} className="hero-video-bg hero-bg-next"
              autoPlay loop muted={muted} playsInline preload="metadata"
              onTimeUpdate={e => {
                const v = e.currentTarget;
                if (v.duration) setVideoProgress(v.currentTime / v.duration);
              }}
            />
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
            {events.length === 0 ? (
              <div className="ev-chip" style={{ opacity: 0.35 }}>
                <span className="ev-name">Loading events…</span>
              </div>
            ) : (
              <div className="hero-events-track">
                {events.slice(1).map((e, i) => (
                  <EventChip key={i} event={e} onOpen={openLink} />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Bottom-right: next event + patch notes cards */}
        <div className="hero-info-panel">
          {nextEvent && (
            <div className="next-event-wrap">
              <span className="info-card-label">Next Event</span>
              <div
                className="next-event-card"
                onClick={() => nextEvent.externalUrl && openLink(nextEvent.externalUrl)}
                style={{ cursor: nextEvent.externalUrl ? 'pointer' : 'default' }}
              >
                {nextEvent.imageUrl && <img className="next-event-bg" src={nextEvent.imageUrl} alt="" />}
                <div className="next-event-overlay" />
                <div className="next-event-content">
                  <span className="next-event-name">{nextEvent.title}</span>
                  <span className="next-event-time">{fmtRelative(new Date(nextEvent.dateTime))}</span>
                </div>
              </div>
            </div>
          )}
          {PATCHES[0] && (
            <div className="hero-patches-group">
              <span className="info-card-label">Patch Notes</span>
              <div className="patch-card" onClick={() => openLink(PATCH_URL)}>
                  <ul className="patch-card-list">
                    {PATCHES[0].bullets.slice(0, 3).map((b, i) => <li key={i}>{b}</li>)}
                  </ul>
                  <div className="patch-card-ver">{PATCHES[0].version}</div>
                </div>
            </div>
          )}
        </div>

        {featured.length > 1 && (
          <div className="hero-tabs">
            {featured.map((_, i) => (
              <button key={i} className={`hero-tab${i === idx ? ' active' : ''}`} onClick={() => goTo(i)} />
            ))}
          </div>
        )}

        {heroVideo && (
          <div className="hero-video-progress">
            <div className="hero-video-progress-bar" style={{ width: `${videoProgress * 100}%` }} />
          </div>
        )}

        {heroVideo && (
          <div
            className="hero-volume-ctrl"
            onMouseEnter={() => {
              if (sliderHideRef.current) clearTimeout(sliderHideRef.current);
              setSliderVisible(true);
            }}
            onMouseLeave={() => {
              sliderHideRef.current = setTimeout(() => setSliderVisible(false), 2500);
            }}
          >
            <Tooltip label={muted ? 'Unmute' : 'Mute'} side="top">
            <button className="hero-mute-btn" onClick={() => {
              const nowMuted = !muted;
              setMuted(nowMuted);
              if (bgMusic?.current) {
                if (nowMuted) bgMusic.current.play().catch(() => {});
                else bgMusic.current.pause();
              }
            }}>
              {muted
                ? <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><line x1="23" y1="9" x2="17" y2="15"/><line x1="17" y1="9" x2="23" y2="15"/></svg>
                : <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/></svg>
              }
            </button>
            </Tooltip>
            {!muted && (
              <input
                className={`hero-volume-slider${sliderVisible ? ' visible' : ''}`}
                type="range" min={0} max={1} step={0.05}
                value={volume}
                onChange={e => {
                  const v = parseFloat(e.target.value);
                  setVolume(v);
                  if (videoRef.current) videoRef.current.volume = v;
                  if (sliderHideRef.current) clearTimeout(sliderHideRef.current);
                  sliderHideRef.current = setTimeout(() => setSliderVisible(false), 2500);
                }}
              />
            )}
          </div>
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
