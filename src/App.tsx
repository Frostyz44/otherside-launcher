import { useState, useRef, useEffect } from 'react';
import { ChevronRight, Minus, Settings2, X } from 'lucide-react';
import { Tooltip } from './components/Tooltip';
import SocialPanel from './components/SocialPanel';
import oswikiLogo from './assets/oswiki_logo.png';
import Home from './pages/Home';
import Experiences from './pages/Experiences';
import SettingsPage, { loadSettings, saveSettings } from './pages/Settings';
import type { NavPage, Settings } from './types';
import { sfxClick, sfxNavigate, sfxHover, sfxHoverPlay, sfxLaunch, preloadSounds } from './sounds';
import './App.css';

const NAV: { id: NavPage; label: string }[] = [
  { id: 'home', label: 'Home' },
  { id: 'experiences', label: 'Experiences' },
  { id: 'shop', label: 'Shop' },
];

function invoke(cmd: string, args?: Record<string, unknown>) {
  return window.__TAURI_INTERNALS__?.invoke(cmd, args);
}

export default function App() {
  const [page, setPage] = useState<NavPage>('home');
  const [settings, setSettings] = useState<Settings>(loadSettings());
  const [visited, setVisited] = useState<Set<NavPage>>(new Set(['home']));
  const [updateInfo, setUpdateInfo] = useState<{ version: string; install: () => Promise<void> } | null>(null);
  const [updating, setUpdating] = useState(false);
  const bgMusicRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const saved = loadSettings();
    if (!saved.bgMusic) return;
    const audio = new Audio('/sounds/background-sound.mp3');
    audio.loop = true;
    audio.volume = 0.05;
    bgMusicRef.current = audio;
    const play = () => { audio.play().catch(() => {}); };
    window.addEventListener('click', play, { once: true });
    let unlistenFocus: (() => void) | null = null;
    import('@tauri-apps/api/window').then(({ getCurrentWindow }) => {
      getCurrentWindow().onFocusChanged(({ payload: focused }) => {
        if (!bgMusicRef.current) return;
        if (focused) bgMusicRef.current.play().catch(() => {});
        else bgMusicRef.current.pause();
      }).then(fn => { unlistenFocus = fn; });
    }).catch(() => {});
    return () => {
      window.removeEventListener('click', play);
      unlistenFocus?.();
      audio.pause();
    };
  }, []);

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
              <Tooltip label="Minimize" side="bottom">
                <button className="wc-btn" onClick={() => invoke('plugin:window|minimize', { label: 'main' })}>
                  <Minus size={13} strokeWidth={2} />
                </button>
              </Tooltip>
              <Tooltip label="Settings" side="bottom">
                <button className={`wc-btn wc-settings${page === 'settings' ? ' wc-settings-active' : ''}`} onClick={handleSettingsToggle}>
                  <Settings2 size={14} strokeWidth={1.75} />
                </button>
              </Tooltip>
              <Tooltip label="Close to tray" side="bottom">
                <button className="wc-btn wc-close" onClick={handleClose}>
                  <X size={14} strokeWidth={2} />
                </button>
              </Tooltip>
            </div>
          </div>
        </div>
      </header>

      {/* ── Main area ── */}
      <div className="main-area">
        {/* Content */}
        <div className="content-area">
          {(['home', 'experiences', 'shop', 'settings'] as const).map(id => (
            <div key={id} className={`page-mount${page === id ? ' page-mount-active' : ''}`}>
              {visited.has(id) && id === 'home' && <Home bgMusic={bgMusicRef} />}
              {visited.has(id) && id === 'experiences' && <Experiences />}
              {visited.has(id) && id === 'shop' && <div className="page-soon">Shop coming soon</div>}
              {visited.has(id) && id === 'settings' && <SettingsPage settings={settings} onChange={handleSettingsChange} bgMusic={bgMusicRef} />}
            </div>
          ))}
        </div>

        {/* ── Right social panel ── */}
        <SocialPanel />
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
