import { useState } from 'react';
import { Loader2, ExternalLink } from 'lucide-react';
import oswikiLogo from '../assets/oswiki_logo.png';

const LAUNCHER_AUTH_URL = 'https://oswiki.xyz/launcher-auth';

export default function LoginScreen() {
  const [loading, setLoading] = useState(false);

  async function handleConnect() {
    setLoading(true);
    try {
      const { openUrl } = await import('@tauri-apps/plugin-opener');
      await openUrl(LAUNCHER_AUTH_URL);
    } catch {
      window.open(LAUNCHER_AUTH_URL, '_blank');
    }
    // Stay in loading state — deep link callback will complete login
    setTimeout(() => setLoading(false), 10000);
  }

  return (
    <div className="login-screen" data-tauri-drag-region>
      <img
        src="https://cdn.oswiki.xyz/images/frontend/inventory_hero.avif"
        alt=""
        className="login-bg-image"
      />
      <div className="login-bg-overlay" />

      <div className="login-card" data-tauri-drag-region>
        <img src={oswikiLogo} alt="OSWiki" className="login-logo" />
        <h1 className="login-title">OSWiki</h1>
        <p className="login-subtitle">Sign in to get started</p>

        <button
          className="login-btn"
          disabled={loading}
          onClick={handleConnect}
        >
          {loading ? (
            <>
              <Loader2 size={16} className="login-spinner" />
              Waiting for browser…
            </>
          ) : (
            <>
              Sign in
              <ExternalLink size={14} style={{ marginLeft: 6, opacity: 0.6 }} />
            </>
          )}
        </button>

        {loading && (
          <p className="login-hint">
            Complete sign-in in your browser, then you'll be redirected back here.
          </p>
        )}
      </div>
    </div>
  );
}
