import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';

const AUTH_KEY = 'oswiki_auth';

interface AuthState {
  loggedIn: boolean;
  address: string | null;
  name: string | null;
  picture: string | null;
  token: string | null;
}

interface AuthContextValue extends AuthState {
  login: (state: Partial<Omit<AuthState, 'loggedIn'>>) => void;
  logout: () => void;
}

function loadAuth(): AuthState {
  try {
    return { loggedIn: false, address: null, name: null, picture: null, token: null, ...JSON.parse(localStorage.getItem(AUTH_KEY) ?? '{}') };
  } catch {
    return { loggedIn: false, address: null, name: null, picture: null, token: null };
  }
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>(loadAuth);

  const login = useCallback((extra: Partial<Omit<AuthState, 'loggedIn'>> = {}) => {
    const next: AuthState = { loggedIn: true, address: null, name: null, picture: null, token: null, ...extra };
    localStorage.setItem(AUTH_KEY, JSON.stringify(next));
    setState(next);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(AUTH_KEY);
    setState({ loggedIn: false, address: null, name: null, picture: null, token: null });
  }, []);

  return <AuthContext.Provider value={{ ...state, login, logout }}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be inside AuthProvider');
  return ctx;
}
