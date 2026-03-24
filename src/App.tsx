import { useState, useRef, useEffect } from 'react';
import { Bell, ChevronRight, MessageSquare, Mic, Minus, Settings2, Users, X } from 'lucide-react';
import oswikiLogo from './assets/oswiki_logo.png';
import Home from './pages/Home';
import Experiences from './pages/Experiences';
import Market from './pages/Market';
import SettingsPage, { loadSettings, saveSettings } from './pages/Settings';
import type { NavPage, Settings } from './types';
import { sfxClick, sfxNavigate, sfxHover, sfxHoverPlay, sfxLaunch, preloadSounds } from './sounds';
import './App.css';

interface Notif { id: number; title: string; body: string; time: string; unread: boolean; }

const NOTIFICATIONS: Notif[] = [
  { id: 1, title: 'CHAOS TRIALS', body: 'Starting in 30 minutes — Kodas weekly event', time: '2m ago', unread: true },
  { id: 2, title: 'Patch 2026.03.19', body: 'Mega Koda room now open to all Kodas', time: '1h ago', unread: true },
  { id: 3, title: 'The Render Pool', body: 'Weekly session starts at 8:00 PM UTC', time: '3h ago', unread: false },
  { id: 4, title: 'Otherside Update', body: 'New daily tasks and challenge leaderboard reset', time: '1d ago', unread: false },
];

const NAV: { id: NavPage; label: string }[] = [
  { id: 'home', label: 'Home' },
  { id: 'experiences', label: 'Experiences' },
  { id: 'shop', label: 'Shop' },
];

interface Friend { id: number; name: string; status: string; activity: string; avatar: string; }

const FRIENDS: Friend[] = [
  { id: 1, name: 'Figge', status: 'ingame', activity: 'Playing VibeMaker', avatar: 'https://pbs.twimg.com/profile_images/1988344914074365952/yZsaD2JO_400x400.jpg' },
  { id: 2, name: 'Garga', status: 'online', activity: 'Browsing OSWiki', avatar: 'https://pbs.twimg.com/profile_images/1826272616354660352/GTUwX_rD_400x400.jpg' },
  { id: 3, name: 'Dong Socks', status: 'ingame', activity: 'Playing Bathroom Blitz', avatar: 'https://pbs.twimg.com/profile_images/1984636520666386432/XfbIxoE-_400x400.jpg' },
  { id: 4, name: 'Cryptollie.eth', status: 'online', activity: 'Online', avatar: 'https://pbs.twimg.com/profile_images/2019834881044312064/drL4flEi_400x400.jpg' },
  { id: 5, name: 'Peter Parker', status: 'ingame', activity: 'Playing VibeMaker', avatar: 'https://pbs.twimg.com/profile_images/2019524715983826944/66gTwxxl_400x400.jpg' },
  { id: 6, name: 'pm0721', status: 'online', activity: 'Browsing OSWiki', avatar: 'https://pbs.twimg.com/profile_images/1893018291691528192/TsvykeER_400x400.jpg' },
  { id: 7, name: 'Cryptoangie', status: 'away', activity: 'Away', avatar: 'https://pbs.twimg.com/profile_images/2010778872988524544/BAx4Ho2L_400x400.jpg' },
  { id: 8, name: 'abp.eth', status: 'away', activity: 'Away', avatar: 'https://pbs.twimg.com/profile_images/2026698711175475200/yxqjaF4i_400x400.jpg' },
  { id: 9, name: 'wale.moca', status: 'offline', activity: 'Last seen 30m ago', avatar: 'https://pbs.twimg.com/profile_images/1700199367511064576/v-3PNyPw_400x400.jpg' },
  { id: 10, name: 'greg', status: 'offline', activity: 'Last seen 1h ago', avatar: 'https://pbs.twimg.com/profile_images/1581014308397502464/NPogKMyk_400x400.jpg' },
  { id: 11, name: 'vitalik.eth', status: 'offline', activity: 'Last seen 2h ago', avatar: 'https://pbs.twimg.com/profile_images/2006515705223516160/wGIa8vCp_400x400.png' },
  { id: 12, name: 'beeple', status: 'offline', activity: 'Last seen 3h ago', avatar: 'https://pbs.twimg.com/profile_images/264316321/beeple_headshot_beat_up_400x400.jpg' },
  { id: 13, name: 'Luca Netz', status: 'offline', activity: 'Last seen 1d ago', avatar: 'https://pbs.twimg.com/profile_images/1849498278255071232/drdvg74U_400x400.jpg' },
  { id: 14, name: 'Sketch', status: 'online', activity: 'Online', avatar: 'https://pbs.twimg.com/profile_images/1963899125188976640/zDxVTF-W_400x400.jpg' },
];

const STATUS_DOT: Record<string, string> = {
  ingame: '#4ade80',
  online: '#60a5fa',
  away: '#fbbf24',
  offline: '#374151',
};


function invoke(cmd: string, args?: Record<string, unknown>) {
  return window.__TAURI_INTERNALS__?.invoke(cmd, args);
}

function NotifBell() {
  const [open, setOpen] = useState(false);
  const [notifs, setNotifs] = useState(NOTIFICATIONS);
  const ref = useRef<HTMLDivElement>(null);
  const unread = notifs.filter(n => n.unread).length;

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    if (open) document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, [open]);

  function markAllRead() {
    sfxClick();
    setNotifs(n => n.map(x => ({ ...x, unread: false })));
  }

  return (
    <div className="notif-wrap" ref={ref} data-tauri-drag-region={false}>
      <button className="notif-btn" onClick={() => { sfxClick(); setOpen(o => !o); }} title="Notifications">
        <Bell size={18} strokeWidth={1.75} />
      </button>
      {unread > 0 && <span className="notif-dot">{unread}</span>}
      {open && (
        <div className="notif-panel">
          <div className="notif-head">
            <span className="notif-title">Notifications</span>
            {unread > 0 && <button className="notif-mark" onClick={markAllRead}>Mark all read</button>}
          </div>
          <div className="notif-list">
            {notifs.map(n => (
              <div key={n.id} className={`notif-item${n.unread ? ' unread' : ''}`} onClick={() => { sfxClick(); setNotifs(prev => prev.map(x => x.id === n.id ? { ...x, unread: false } : x)); }}>
                {n.unread && <span className="notif-item-dot" />}
                <div className="notif-item-body">
                  <div className="notif-item-title">{n.title}</div>
                  <div className="notif-item-text">{n.body}</div>
                  <div className="notif-item-time">{n.time}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function App() {
  const [page, setPage] = useState<NavPage>('home');
  const [settings, setSettings] = useState<Settings>(loadSettings());
  const [visited, setVisited] = useState<Set<NavPage>>(new Set(['home']));
  const [updateInfo, setUpdateInfo] = useState<{ version: string; install: () => Promise<void> } | null>(null);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    preloadSounds();
    import('@tauri-apps/plugin-updater').then(({ check }) =>
      check().then(async update => {
        if (!update?.available) return;
        setUpdateInfo({
          version: update.version,
          install: async () => {
            setUpdating(true);
            await update.downloadAndInstall();
            const { relaunch } = await import('@tauri-apps/plugin-process');
            await relaunch();
          },
        });
      }).catch(() => {})
    ).catch(() => {});
  }, []);

  useEffect(() => {
    const pages = NAV.map(n => n.id);
    function onKey(e: KeyboardEvent) {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.key === '1') navigate('home');
      else if (e.key === '2') navigate('experiences');
      else if (e.key === '3') navigate('shop');
      else if (e.key === 'Tab' && !e.shiftKey) {
        e.preventDefault();
        const cur = pages.indexOf(page);
        navigate(pages[(cur + 1) % pages.length]);
      } else if (e.key === 'Tab' && e.shiftKey) {
        e.preventDefault();
        const cur = pages.indexOf(page);
        navigate(pages[(cur - 1 + pages.length) % pages.length]);
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [page]);

  function navigate(p: NavPage) {
    sfxNavigate();
    setPage(p);
    setVisited(v => { const n = new Set(v); n.add(p); return n; });
  }

  function handleSettingsChange(s: Settings) {
    setSettings(s);
    saveSettings(s);
  }

  function handleClose() {
    if (settings.minimizeToTray) {
      invoke('plugin:window|hide', { label: 'main' });
    } else {
      invoke('plugin:window|close', { label: 'main' });
    }
  }

  function handleSettingsToggle() {
    sfxClick();
    navigate(page === 'settings' ? 'home' : 'settings');
  }

  const online = FRIENDS.filter(f => f.status !== 'offline');
  const offline = FRIENDS.filter(f => f.status === 'offline');

  return (
    <div className="app">
      {updateInfo && (
        <div className="update-toast">
          <span className="update-toast-label">OSWiki Launcher <strong>v{updateInfo.version}</strong> is available</span>
          <button className="update-toast-btn" disabled={updating} onClick={updateInfo.install}>
            {updating ? 'Installing…' : 'Update now'}
          </button>
          <div style={{flex:1}} />
          <button className="update-toast-dismiss" onClick={() => setUpdateInfo(null)}>✕</button>
        </div>
      )}
      {/* ── Top bar ── */}
      <header className="topbar" data-tauri-drag-region>
        <div className="topbar-left">
          <button
            className="play-btn"
            onMouseEnter={sfxHoverPlay}
            onClick={(e) => {
              const btn = e.currentTarget;
              const rect = btn.getBoundingClientRect();
              const ripple = document.createElement('span');
              ripple.className = 'play-btn-ripple';
              ripple.style.left = `${e.clientX - rect.left}px`;
              ripple.style.top = `${e.clientY - rect.top}px`;
              btn.appendChild(ripple);
              ripple.addEventListener('animationend', () => ripple.remove());
              sfxLaunch();
              import('@tauri-apps/plugin-opener').then(({ openUrl }) => openUrl('https://otherside.xyz'));
            }}
          >
            <img src={oswikiLogo} alt="OSWiki" className="play-btn-logo" />
            PLAY
            <ChevronRight className="play-btn-arrow" strokeWidth={2.5} />
          </button>
          <nav className="top-nav">
            {NAV.map(item => (
              <button
                key={item.id}
                className={`top-nav-item${page === item.id ? ' top-nav-active' : ''}`}
                onMouseEnter={sfxHover}
                onClick={() => navigate(item.id)}
              >
                {item.label}
                {page === item.id && <span className="top-nav-bar" />}
              </button>
            ))}
          </nav>
        </div>

        <div className="topbar-right" data-tauri-drag-region={false}>
          {/* Profile + window controls — unified right block */}
          <div className="topbar-right-block" data-tauri-drag-region={false}>
            <div className="tp-avatar-wrap">
              <img
                src="https://pbs.twimg.com/profile_images/1977408040438542336/XKfN2_rv_400x400.jpg"
                alt="Frostyz"
                className="tp-avatar"
              />
              <span className="tp-status-dot" />
            </div>
            <div className="tp-info">
              <span className="tp-name">Frostyz</span>
              <span className="tp-level">Level 40</span>
            </div>
            <div className="wc-buttons">
              <button className="wc-btn" title="Minimize" onClick={() => invoke('plugin:window|minimize', { label: 'main' })}>
                <Minus size={13} strokeWidth={2} />
              </button>
              <button className={`wc-btn wc-settings${page === 'settings' ? ' wc-settings-active' : ''}`} title="Settings" onClick={handleSettingsToggle}>
                <Settings2 size={14} strokeWidth={1.75} />
              </button>
              <button className="wc-btn wc-close" title="Close" onClick={handleClose}>
                <X size={14} strokeWidth={2} />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* ── Main area ── */}
      <div className="main-area">
        {/* Content */}
        <div className="content-area">
          {(['home', 'experiences', 'market', 'shop', 'settings'] as const).map(id => (
            <div key={id} className={`page-mount${page === id ? ' page-mount-active' : ''}`}>
              {visited.has(id) && id === 'home' && <Home />}
              {visited.has(id) && id === 'experiences' && <Experiences />}
              {visited.has(id) && id === 'market' && <Market />}
              {visited.has(id) && id === 'shop' && <div className="page-soon">Shop coming soon</div>}
              {visited.has(id) && id === 'settings' && <SettingsPage settings={settings} onChange={handleSettingsChange} />}
            </div>
          ))}
        </div>

        {/* ── Right social panel ── */}
        <aside className="social-panel">
          <div className="social-header">
            <span className="social-title">Social</span>
            <span className="social-count">{online.length} online</span>
          </div>

          <div className="social-body">
            <div className="social-section-label">Online — {online.length}</div>
            <div className="friends-list">
              {online.map(f => (
                <div key={f.id} className="friend-row">
                  <div className="friend-avatar">
                    <img src={f.avatar} alt={f.name} className="friend-avatar-img" />
                    <span className="friend-status-dot" style={{ background: STATUS_DOT[f.status] }} />
                  </div>
                  <div className="friend-info">
                    <span className="friend-name">{f.name}</span>
                    <span className="friend-activity" style={{ color: f.status === 'ingame' ? '#4ade80' : undefined }}>
                      {f.activity}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {offline.length > 0 && (
              <>
                <div className="social-section-label" style={{ marginTop: 12 }}>Offline — {offline.length}</div>
                <div className="friends-list">
                  {offline.map(f => (
                    <div key={f.id} className="friend-row friend-row-offline">
                      <div className="friend-avatar friend-avatar-offline">
                        <img src={f.avatar} alt={f.name} className="friend-avatar-img" />
                        <span className="friend-status-dot" style={{ background: STATUS_DOT[f.status] }} />
                      </div>
                      <div className="friend-info">
                        <span className="friend-name">{f.name}</span>
                        <span className="friend-activity">{f.activity}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Social action bar */}
          <div className="social-actions">
            <div className="social-actions-left">
              <NotifBell />
              <button className="social-action-btn" title="Chat"><MessageSquare size={15} strokeWidth={1.75} /></button>
              <button className="social-action-btn" title="Voice"><Mic size={15} strokeWidth={1.75} /></button>
              <button className="social-action-btn" title="Party"><Users size={15} strokeWidth={1.75} /></button>
            </div>
            <span className="social-version">v0.0.1</span>
          </div>

        </aside>
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
