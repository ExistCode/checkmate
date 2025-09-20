import { LanguageProvider } from "@/components/language-provider";
import { ThemeProvider } from "next-themes";
import CognitoProvider from "@/components/CognitoProvider";

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <CognitoProvider>
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
    </CognitoProvider>
  );
}
