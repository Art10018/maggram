// frontend/src/store/auth.jsx
import { createContext, useContext, useEffect, useMemo, useState } from "react";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(localStorage.getItem("token") || "");
  const [user, setUserState] = useState(() => {
    const raw = localStorage.getItem("user");
    return raw ? JSON.parse(raw) : null;
  });

  const isAuthed = !!token;

  const login = (newToken, newUser) => {
    setToken(newToken);
    setUserState(newUser);
    localStorage.setItem("token", newToken);
    localStorage.setItem("user", JSON.stringify(newUser));
  };

  const logout = () => {
    setToken("");
    setUserState(null);
    localStorage.removeItem("token");
    localStorage.removeItem("user");
  };

  const setUser = (u) => {
    setUserState(u);
    localStorage.setItem("user", JSON.stringify(u));
  };

  useEffect(() => {
    if (!token) return;
    localStorage.setItem("token", token);
  }, [token]);

  const value = useMemo(
    () => ({ token, user, isAuthed, login, logout, setUser }),
    [token, user, isAuthed]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
