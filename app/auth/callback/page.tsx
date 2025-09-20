"use client";

import { useEffect } from "react";

export default function CognitoCallbackPage() {
  useEffect(() => {
    try {
      const hash = window.location.hash.replace(/^#/, "");
      const params = new URLSearchParams(hash);
      const idToken = params.get("id_token");
      const accessToken = params.get("access_token");
      const expiresIn = Number(params.get("expires_in") || "3600");
      const expDate = new Date(Date.now() + expiresIn * 1000);

      if (idToken) {
        document.cookie = `id_token=${encodeURIComponent(idToken)}; path=/; expires=${expDate.toUTCString()}`;
      }
      if (accessToken) {
        document.cookie = `access_token=${encodeURIComponent(accessToken)}; path=/; expires=${expDate.toUTCString()}`;
      }
      try {
        localStorage.setItem("auth_updated", String(Date.now()));
      } catch {}
    } finally {
      window.location.replace("/");
    }
  }, []);
  return null;
}

