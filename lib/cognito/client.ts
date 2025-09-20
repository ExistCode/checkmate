"use client";

import { useEffect, useMemo, useState } from "react";

type CognitoUser = {
  sub: string;
  email?: string;
  given_name?: string;
  family_name?: string;
  nickname?: string;
  name?: string;
};

function getCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie
    .split(";")
    .map((c) => c.trim())
    .find((c) => c.startsWith(name + "="));
  return match ? decodeURIComponent(match.split("=").slice(1).join("=")) : null;
}

function parseJwt<T = any>(token: string | null): T | null {
  if (!token) return null;
  try {
    const [, payload] = token.split(".");
    if (!payload) return null;
    const json = atob(payload.replace(/-/g, "+").replace(/_/g, "/"));
    return JSON.parse(json);
  } catch {
    return null;
  }
}

export function useCognitoAuth() {
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === "auth_updated") setTick((t) => t + 1);
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const idToken = getCookie("id_token");
  const accessToken = getCookie("access_token");
  const claims = useMemo(() => parseJwt<CognitoUser>(idToken || accessToken), [idToken, accessToken, tick]);

  const isSignedIn = Boolean(claims?.sub);
  const user = claims
    ? {
        id: claims.sub,
        email: claims.email,
        firstName: claims.given_name,
        lastName: claims.family_name,
        username: claims.nickname || claims.name || claims.email?.split("@")[0],
      }
    : null;

  return { isSignedIn, user, idToken, accessToken } as const;
}

