"use client";

import { AuthProvider } from "@/components/auth/auth-context";
import { LanguageProvider } from "@/components/language-provider";
import { ThemeProvider } from "next-themes";
import ConvexClientProvider from "./convex-client-provider";

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <ConvexClientProvider>
        <LanguageProvider>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            {children}
          </ThemeProvider>
        </LanguageProvider>
      </ConvexClientProvider>
    </AuthProvider>
  );
}
