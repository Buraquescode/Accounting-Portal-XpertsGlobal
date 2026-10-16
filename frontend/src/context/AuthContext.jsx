import { createContext, useCallback, useEffect, useMemo, useState } from 'react';
import * as authApi from '../api/auth.api';
import { setUnauthorizedHandler } from '../api/axiosClient';

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Restore the session from the httpOnly cookie on page load.
  useEffect(() => {
    authApi.me().then((r) => setUser(r.data.user)).catch(() => setUser(null)).finally(() => setLoading(false));
  }, []);

  // A 401 anywhere (expired or revoked session) clears the user; ProtectedRoute then redirects to /login.
  useEffect(() => { setUnauthorizedHandler(() => setUser(null)); }, []);

  const login = useCallback(async (email, password) => {
    const res = await authApi.login(email, password);
    // 2FA-ready: the server may ask for a second step, which is not enabled in this build.
    if (res.data?.requiresTwoFactor) return { requiresTwoFactor: true };
    setUser(res.data.user);
    return { requiresTwoFactor: false };
  }, []);

  const logout = useCallback(async () => {
    try { await authApi.logout(); } finally { setUser(null); }
  }, []);

  const value = useMemo(() => ({
    user, loading, login, logout,
    hasRole: (role) => !!user?.roles.includes(role),
    hasAnyRole: (...roles) => roles.some((r) => user?.roles.includes(r)),
  }), [user, loading, login, logout]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
