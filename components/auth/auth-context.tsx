"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

export interface AuthUser {
  id: string;
  email: string | null;
  firstName: string | null;
  lastName: string | null;
  username: string | null;
  imageUrl: string | null;
}

interface AuthContextValue {
  user: AuthUser | null;
  loading: boolean;
  signIn: () => Promise<void>;
  signOut: () => Promise<void>;
  refresh: () => Promise<void>;
  getIdToken: () => string | null;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

function getCookieValue(name: string) {
  if (typeof document === "undefined") {
    return null;
  }
  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : null;
}

async function fetchSession() {
  const response = await fetch("/api/auth/session", {
    credentials: "include",
  });

  if (!response.ok) {
    return null;
  }

  const data = (await response.json()) as { user: AuthUser | null };
  return data.user;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  const loadSession = useCallback(async () => {
    setLoading(true);
    try {
      const sessionUser = await fetchSession();
      setUser(sessionUser);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadSession();
  }, [loadSession]);

  const signIn = useCallback(async () => {
    const redirect = window.location.pathname + window.location.search;
    const response = await fetch(
      `/api/auth/authorize?redirect=${encodeURIComponent(redirect)}`,
      {
        credentials: "include",
      }
    );

    if (!response.ok) {
      throw new Error("Failed to start Cognito sign-in");
    }

    const data = (await response.json()) as { url: string };
    window.location.href = data.url;
  }, []);

  const signOut = useCallback(async () => {
    window.location.href = "/api/auth/logout";
  }, []);

  const refresh = useCallback(async () => {
    await loadSession();
  }, [loadSession]);

  const getIdToken = useCallback(() => {
    return getCookieValue("cognito_id_token");
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({ user, loading, signIn, signOut, refresh, getIdToken }),
    [user, loading, signIn, signOut, refresh, getIdToken]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
