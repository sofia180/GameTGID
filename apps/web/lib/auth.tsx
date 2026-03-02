"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { apiFetch } from "./api";

export interface User {
  id: string;
  telegramId: string;
  username?: string | null;
  referralCode: string;
}

interface AuthContextValue {
  user: User | null;
  token: string | null;
  status: "idle" | "loading" | "ready";
  loginTelegram: (initData: string, referralCode?: string) => Promise<void>;
  loginDev: (telegramId: string, username?: string, referralCode?: string) => Promise<void>;
  logout: () => void;
  authFetch: <T>(path: string, options?: RequestInit) => Promise<T>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [status, setStatus] = useState<"idle" | "loading" | "ready">("idle");

  useEffect(() => {
    const stored = window.localStorage.getItem("auth_token");
    if (!stored) {
      setStatus("ready");
      return;
    }
    setToken(stored);
    setStatus("loading");
    apiFetch<{ user: User }>("/me", {}, stored)
      .then((data) => setUser(data.user))
      .catch(() => {
        window.localStorage.removeItem("auth_token");
        setToken(null);
      })
      .finally(() => setStatus("ready"));
  }, []);

  const loginTelegram = useCallback(async (initData: string, referralCode?: string) => {
    const data = await apiFetch<{ token: string; user: User }>("/auth/telegram", {
      method: "POST",
      body: JSON.stringify({ initData, referralCode })
    });
    window.localStorage.setItem("auth_token", data.token);
    setToken(data.token);
    setUser(data.user);
  }, []);

  const loginDev = useCallback(async (telegramId: string, username?: string, referralCode?: string) => {
    const data = await apiFetch<{ token: string; user: User }>("/auth/dev", {
      method: "POST",
      body: JSON.stringify({ telegramId, username, referralCode })
    });
    window.localStorage.setItem("auth_token", data.token);
    setToken(data.token);
    setUser(data.user);
  }, []);

  const logout = useCallback(() => {
    window.localStorage.removeItem("auth_token");
    setToken(null);
    setUser(null);
  }, []);

  const authFetch = useCallback(
    async <T,>(path: string, options: RequestInit = {}) => {
      if (!token) throw new Error("Not authenticated");
      return apiFetch<T>(path, options, token);
    },
    [token]
  );

  const value = useMemo(
    () => ({ user, token, status, loginTelegram, loginDev, logout, authFetch }),
    [user, token, status, loginTelegram, loginDev, logout, authFetch]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("AuthProvider missing");
  return ctx;
}
