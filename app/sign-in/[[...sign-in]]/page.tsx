"use client";

import { SearchCheck } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Page() {
  // Normalize domain from env: remove protocol (even if colon missing), strip paths, and trailing slashes
  const rawDomain = process.env.NEXT_PUBLIC_COGNITO_DOMAIN!;
  const domain = rawDomain
    .trim()
    .replace(/^https?:?\/\//i, "")
    .split("/")[0]
    .replace(/\/+$/g, "");
  const clientId = process.env.NEXT_PUBLIC_COGNITO_CLIENT_ID!;
  const goSignIn = () => {
    const redirect = encodeURIComponent(
      `${window.location.origin}/auth/callback`
    );
    const url = `https://${domain}/oauth2/authorize?client_id=${encodeURIComponent(
      clientId
    )}&response_type=token&redirect_uri=${redirect}&scope=openid+email+profile`;
    window.location.href = url;
  };
  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-6">
        <div className="flex items-center gap-2 mb-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <SearchCheck className="h-6 w-6" />
          </div>
          <span className="text-2xl font-bold">Checkmate</span>
        </div>
        <Button onClick={goSignIn} size="lg">
          Continue with Cognito
        </Button>
      </div>
    </div>
  );
}
