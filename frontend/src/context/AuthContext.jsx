import { createContext, useCallback, useContext, useEffect, useState } from "react";
import api from "../api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(sessionStorage.getItem("sb_token"));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) {
      setLoading(false);
      return;
    }
    // Restore the cached profile immediately so the UI never flips to
    // "logged out" while the backend is cold-starting (Render free tier).
    const cached = sessionStorage.getItem("sb_user");
    if (cached) {
      try {
        setUser(JSON.parse(cached));
      } catch {
        /* ignore malformed cache */
      }
    }
    api
      .get("/api/auth/me")
      .then((res) => {
        setUser(res.data);
        sessionStorage.setItem("sb_user", JSON.stringify(res.data));
      })
      .catch((err) => {
        // Only a real 401 means the session is dead. Network/5xx errors
        // (e.g. Render cold start) should NOT log the user out.
        if (err.response?.status === 401) {
          setUser(null);
          setToken(null);
          sessionStorage.removeItem("sb_token");
          sessionStorage.removeItem("sb_user");
        }
      })
      .finally(() => setLoading(false));
  }, [token]);

  const login = useCallback(async (email, password) => {
    const res = await api.post("/api/auth/login", { email, password });
    const { access_token, user: u } = res.data;
    sessionStorage.setItem("sb_token", access_token);
    sessionStorage.setItem("sb_user", JSON.stringify(u));
    setToken(access_token);
    setUser(u);
    return u;
  }, []);

  const register = useCallback(async (payload) => {
    const res = await api.post("/api/auth/register", payload);
    const { access_token, user: u } = res.data;
    sessionStorage.setItem("sb_token", access_token);
    sessionStorage.setItem("sb_user", JSON.stringify(u));
    setToken(access_token);
    setUser(u);
    return u;
  }, []);

  const logout = useCallback(() => {
    sessionStorage.removeItem("sb_token");
    sessionStorage.removeItem("sb_user");
    setToken(null);
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
