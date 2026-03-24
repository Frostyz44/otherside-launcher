import { useState, type RefObject } from 'react';
import type { Settings } from '../types';

const SETTINGS_KEY = 'oswiki_settings';

export function loadSettings(): Settings {
  try {
    return {
      minimizeToTray: true,
      launchAtStartup: false,
      notifications: true,
      bgMusic: true,
      ...JSON.parse(localStorage.getItem(SETTINGS_KEY) ?? '{}'),
    };
  } catch {
    return { minimizeToTray: true, launchAtStartup: false, notifications: true, bgMusic: true };
  }
}

export function saveSettings(s: Settings) {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(s));
}

interface Props {
  settings: Settings;
  onChange: (s: Settings) => void;
  bgMusic?: RefObject<HTMLAudioElement | null>;
}

function Toggle({ label, description, checked, onChange }: {
  label: string;
  description: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="setting-row">
      <div className="setting-text">
        <span className="setting-label">{label}</span>
        <span className="setting-desc">{description}</span>
      </div>
      <button
        className={`toggle ${checked ? 'toggle-on' : ''}`}
        onClick={() => onChange(!checked)}
        aria-checked={checked}
        role="switch"
      >
        <span className="toggle-thumb" />
      </button>
    </div>
  );
}

export default function Settings({ settings, onChange, bgMusic }: Props) {
  const [updateStatus, setUpdateStatus] = useState<'idle' | 'checking' | 'latest' | 'available'>('idle');

  async function checkForUpdates() {
    setUpdateStatus('checking');
    try {
      const { check } = await import('@tauri-apps/plugin-updater');
      const update = await check();
      if (update?.available) {
        setUpdateStatus('available');
        const { relaunch } = await import('@tauri-apps/plugin-process');
        await update.downloadAndInstall();
        await relaunch();
      } else {
        setUpdateStatus('latest');
        setTimeout(() => setUpdateStatus('idle'), 3000);
      }
    } catch (e) {
      console.error('Update check failed:', e);
      setUpdateStatus('idle');
    }
  }

  function update(key: keyof Settings, val: boolean) {
    const next = { ...settings, [key]: val };
    onChange(next);
    saveSettings(next);
  }

  return (
    <div className="settings-page">
      <div className="page-header">
        <h1 className="page-title">Settings</h1>
      </div>

      <div className="page-scroll" style={{ flex: 1, overflowY: 'auto', padding: 16 }}>
        <section className="settings-section">
          <h2 className="section-title">App Behavior</h2>
          <div className="settings-card">
            <Toggle
              label="Minimize to tray on close"
              description="Keep the launcher running in the system tray when you close the window"
              checked={settings.minimizeToTray}
              onChange={v => update('minimizeToTray', v)}
            />
            <div className="setting-divider" />
            <Toggle
              label="Launch at startup"
              description="Automatically start OSWiki Launcher when Windows starts"
              checked={settings.launchAtStartup}
              onChange={v => update('launchAtStartup', v)}
            />
            <div className="setting-divider" />
            <Toggle
              label="Notifications"
              description="Receive notifications when experiences go live or have updates"
              checked={settings.notifications}
              onChange={v => update('notifications', v)}
            />
            <div className="setting-divider" />
            <Toggle
              label="Background music"
              description="Play ambient music while the launcher is open"
              checked={settings.bgMusic}
              onChange={v => {
                update('bgMusic', v);
                if (bgMusic?.current) {
                  if (v) bgMusic.current.play().catch(() => {});
                  else bgMusic.current.pause();
                }
              }}
            />
          </div>
        </section>

        <section className="settings-section">
          <h2 className="section-title">About</h2>
          <div className="settings-card settings-about">
            <div className="about-row">
              <span className="setting-label">OSWiki Launcher</span>
              <span className="setting-desc">v{__APP_VERSION__}</span>
            </div>
            <div className="setting-divider" />
            <div className="about-row">
              <span className="setting-label">Updates</span>
              <button className="about-update-btn" onClick={checkForUpdates} disabled={updateStatus === 'checking' || updateStatus === 'available'}>
                {updateStatus === 'checking' && 'Checking…'}
                {updateStatus === 'latest' && '✓ Up to date'}
                {updateStatus === 'available' && 'Installing…'}
                {updateStatus === 'idle' && 'Check for updates'}
              </button>
            </div>
            <div className="setting-divider" />
            <div className="about-row">
              <span className="setting-label">Website</span>
              <a href="https://oswiki.xyz" target="_blank" rel="noreferrer" className="about-link">oswiki.xyz</a>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
