// src/hooks/useAuth.jsx
import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { authApi } from "../api";

const AuthContext = createContext(null);

function loadUser() {
  try {
    const u = localStorage.getItem("mb_user");
    return u ? JSON.parse(u) : null;
  } catch { return null; }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(loadUser);
  const [loading, setLoading] = useState(!!loadUser());

  // On mount, re-fetch /me to get fresh data (catches password changes, plan updates, etc.)
  useEffect(() => {
    if (!user) { setLoading(false); return; }
    authApi.me()
      .then((fresh) => {
        setUser(fresh);
        localStorage.setItem("mb_user", JSON.stringify(fresh));
      })
      .catch(() => {
        // Token invalid → logout
        authApi.logout();
        setUser(null);
      })
      .finally(() => setLoading(false));
  }, []); // eslint-disable-line

  const login = useCallback(async (email, password) => {
    const u = await authApi.login(email, password);
    setUser(u);
    return u;
  }, []);

  const logout = useCallback(() => {
    authApi.logout();
    setUser(null);
  }, []);

  const refreshUser = useCallback(async () => {
    const fresh = await authApi.me();
    setUser(fresh);
    localStorage.setItem("mb_user", JSON.stringify(fresh));
    return fresh;
  }, []);

  return (
    <AuthContext.Provider value={{ user, setUser, login, logout, refreshUser, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
