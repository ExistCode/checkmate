"use client";

import { useEffect } from "react";
import { ConvexProvider, ConvexReactClient } from "convex/react";
import { useAuth } from "@/components/auth/auth-context";

const convex = new ConvexReactClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export default function ConvexClientProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { getIdToken, user, loading } = useAuth();

  useEffect(() => {
    if (loading) {
      return;
    }

    if (!user) {
      convex.clearAuth();
      return;
    }

    convex.setAuth(async () => getIdToken());
  }, [getIdToken, user, loading]);

  return <ConvexProvider client={convex}>{children}</ConvexProvider>;
}
