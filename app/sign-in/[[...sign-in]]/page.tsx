"use client";

import { SearchCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/components/auth/auth-context";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useLanguage } from "@/components/language-provider";

export default function Page() {
  const { signIn, user, loading } = useAuth();
  const router = useRouter();
  const { t } = useLanguage();

  useEffect(() => {
    if (!loading && user) {
      router.replace("/");
    }
  }, [loading, user, router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-6">
        <div className="flex items-center gap-2 mb-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <SearchCheck className="h-6 w-6" />
          </div>
          <span className="text-2xl font-bold">Checkmate</span>
        </div>
        <Button size="lg" onClick={() => void signIn()} disabled={loading}>
          {loading ? `${t.signIn}...` : t.signIn}
        </Button>
      </div>
    </div>
  );
}
