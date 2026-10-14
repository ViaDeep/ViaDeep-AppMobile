import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';

import { authApi, type User } from '@/api/auth-api';
import { configureSession } from '@/api/http';

import { tokenStorage } from './token-storage';

type SessionState = {
  loading: boolean;
  user: User | null;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
};

const SessionContext = createContext<SessionState | null>(null);

export function SessionProvider({ children }: { children: ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const tokenRef = useRef<string | null>(null);

  const signOut = useCallback(async () => {
    tokenRef.current = null;
    setUser(null);
    await tokenStorage.clear();
  }, []);

  useEffect(() => {
    configureSession({ getToken: () => tokenRef.current, onUnauthorized: () => void signOut() });
  }, [signOut]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const stored = await tokenStorage.read();
      if (stored) {
        try {
          const me = await authApi.me(stored);
          if (!cancelled) {
            tokenRef.current = stored;
            setUser(me);
          }
        } catch {
          // Token vencido o servidor caído: se pide iniciar sesión otra vez.
          await tokenStorage.clear();
        }
      }
      if (!cancelled) {
        setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    const token = await authApi.login(email.trim(), password);
    const me = await authApi.me(token);
    if (me.role !== 'CITIZEN') {
      throw new Error('La app es para ciudadanos. Los operadores usan la plataforma web.');
    }
    await tokenStorage.save(token);
    tokenRef.current = token;
    setUser(me);
  }, []);

  const value = useMemo(() => ({ loading, user, signIn, signOut }), [loading, user, signIn, signOut]);
  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession(): SessionState {
  const value = useContext(SessionContext);
  if (!value) {
    throw new Error('useSession debe usarse dentro de SessionProvider');
  }
  return value;
}
