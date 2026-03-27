import { useState } from 'react';
import { useAuth } from '../auth';
import { Loader2 } from 'lucide-react';
import oswikiLogo from '../assets/oswiki_logo.png';

export default function LoginScreen() {
  const { login } = useAuth();
  const [loading, setLoading] = useState(false);

  function handleConnect() {
    setLoading(true);
    // TODO: replace with real wallet connect / SIWE / your auth provider
    setTimeout(() => {
      login({ address: null, name: null, picture: null });
      setLoading(false);
    }, 600);
  }

  return (
    <div className="login-screen" data-tauri-drag-region>
      <div className="login-bg-vignette" />

      <div className="login-card" data-tauri-drag-region>
        <img src={oswikiLogo} alt="OSWiki" className="login-logo" />
        <h1 className="login-title">OSWiki Launcher</h1>
        <p className="login-subtitle">Sign in to continue</p>

        <button
          className="login-btn"
          disabled={loading}
          onClick={handleConnect}
        >
          {loading ? (
            <>
              <Loader2 size={16} className="login-spinner" />
              Connecting…
            </>
          ) : (
            'Sign in'
          )}
        </button>
      </div>
    </div>
  );
}
