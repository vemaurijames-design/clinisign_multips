import { createContext, useContext, useState, useEffect, useRef, ReactNode } from 'react';

interface AuthState {
  token: string | null;
  rol: string | null;
  email: string | null;
  nombre: string | null;
  ipsId: string | null;
  ipsNombre: string | null;
}

interface AuthContextType extends AuthState {
  setAuth: (state: AuthState) => void;
  seleccionarIps: (ipsId: string, ipsNombre: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [auth, setAuthState] = useState<AuthState>({
    token: localStorage.getItem('token'),
    rol: localStorage.getItem('rol'),
    email: localStorage.getItem('email'),
    nombre: localStorage.getItem('nombre'),
    ipsId: localStorage.getItem('ipsId'),
    ipsNombre: localStorage.getItem('ipsNombre'),
  });

  const persist = (state: AuthState) => {
    setAuthState(state);
    localStorage.setItem('token', state.token ?? '');
    localStorage.setItem('rol', state.rol ?? '');
    localStorage.setItem('email', state.email ?? '');
    localStorage.setItem('nombre', state.nombre ?? '');
    localStorage.setItem('ipsId', state.ipsId ?? 'null');
    localStorage.setItem('ipsNombre', state.ipsNombre ?? '');
  };

  const setAuth = (state: AuthState) => persist(state);

  const seleccionarIps = (ipsId: string, ipsNombre: string) => {
    persist({ ...auth, ipsId, ipsNombre });
  };

  const logout = () => {
    localStorage.clear();
    setAuthState({ token: null, rol: null, email: null, nombre: null, ipsId: null, ipsNombre: null });
  };

  // Auto-logout after 15 minutes of inactivity
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const TIMEOUT_MS = 15 * 60 * 1000;

  const resetTimeout = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    if (auth.token) {
      timeoutRef.current = setTimeout(() => {
        alert('Sesión cerrada por inactividad. Inicie sesión nuevamente.');
        logout();
      }, TIMEOUT_MS);
    }
  };

  useEffect(() => {
    const events = ['mousedown', 'keydown', 'scroll', 'touchstart'];
    events.forEach(e => window.addEventListener(e, resetTimeout));
    resetTimeout();
    return () => {
      events.forEach(e => window.removeEventListener(e, resetTimeout));
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [auth.token]);

  return (
    <AuthContext.Provider value={{ ...auth, setAuth, seleccionarIps, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth debe estar dentro de AuthProvider');
  return ctx;
}