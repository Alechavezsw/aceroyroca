import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

const SESSION_KEY = 'acr_session';

interface AuthContextType {
  username: string | null;
  loading: boolean;
  login: (username: string, password: string) => Promise<string | null>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function getStoredToken(): string | null {
  try {
    return localStorage.getItem(SESSION_KEY);
  } catch {
    return null;
  }
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [username, setUsername] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const verifySession = useCallback(async () => {
    const token = getStoredToken();
    if (!token) {
      setUsername(null);
      setLoading(false);
      return;
    }

    try {
      const res = await fetch('/api/auth-verify', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setUsername(data.username);
      } else {
        localStorage.removeItem(SESSION_KEY);
        setUsername(null);
      }
    } catch {
      setUsername(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    verifySession();
  }, [verifySession]);

  const login = async (user: string, password: string): Promise<string | null> => {
    try {
      const res = await fetch('/api/auth-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: user, password })
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        return (data as { error?: string }).error || 'Error al iniciar sesión';
      }

      localStorage.setItem(SESSION_KEY, data.token);
      setUsername(data.username);
      return null;
    } catch {
      return 'No se pudo conectar con el servidor. Verificá que la app esté desplegada con AUTH_USERNAME y AUTH_PASSWORD.';
    }
  };

  const logout = () => {
    localStorage.removeItem(SESSION_KEY);
    setUsername(null);
  };

  return (
    <AuthContext.Provider value={{ username, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth debe usarse dentro de AuthProvider');
  return ctx;
}
