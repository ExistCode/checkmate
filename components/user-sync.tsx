"use client";

import { useAuth } from "@/components/auth/auth-context";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useEffect } from "react";

export default function UserSync() {
  const { user, loading } = useAuth();
  const convexUser = useQuery(api.users.getCurrentUser);
  const createUser = useMutation(api.users.createUser);

  useEffect(() => {
    if (loading || !user) {
      return;
    }

    if (convexUser === null) {
      createUser({
        cognitoId: user.id,
        email: user.email || "",
        firstName: user.firstName || undefined,
        lastName: user.lastName || undefined,
        imageUrl: user.imageUrl || undefined,
        username: user.username || undefined,
      }).catch((error) => {
        console.error("Failed to sync Cognito user", error);
      });
    }
  }, [loading, user, convexUser, createUser]);

  return null;
}
