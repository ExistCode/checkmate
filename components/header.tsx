"use client";

import { SearchCheck, Newspaper, Menu, Sun, Moon } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { useTheme } from "next-themes";
import { LanguageToggle } from "@/components/language-toggle";
import { useLanguage } from "@/components/language-provider";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import React from "react";
import { useAuth } from "@/components/auth/auth-context";

export function Header() {
  const router = useRouter();
  const pathname = usePathname();
  const { t } = useLanguage();
  const { user, loading, signIn, signOut } = useAuth();
  const [menuOpen, setMenuOpen] = React.useState(false);

  const userInitial = React.useMemo(() => {
    const fallback = t.anonymous;
    const source = user?.firstName || user?.username || fallback;
    return source.charAt(0).toUpperCase();
  }, [user, t.anonymous]);

  const MobileLanguageToggle = () => {
    const { language, setLanguage, t } = useLanguage();
    const languages = [
      { code: "en" as const, label: t.english, flag: "EN" },
      { code: "ms" as const, label: t.malay, flag: "MS" },
      { code: "zh" as const, label: t.chinese, flag: "ZH" },
    ];
    return (
      <div className="w-full">
        <Button
          variant="outline"
          size="sm"
          className="w-full justify-start"
          asChild
        >
          <div>
            <span className="inline-block mr-2 align-middle">Lang</span>
            <span className="align-middle mr-2">{t.language}</span>
            <select
              value={language}
              onChange={(e) =>
                setLanguage(e.target.value as "en" | "ms" | "zh")
              }
              className="ml-2 bg-transparent outline-none border-none text-primary"
            >
              {languages.map((lang) => (
                <option key={lang.code} value={lang.code}>
                  {lang.flag} {lang.label}
                </option>
              ))}
            </select>
          </div>
        </Button>
      </div>
    );
  };

  const MobileThemeToggle = () => {
    const { theme, setTheme } = useTheme();
    const { t } = useLanguage();
    const nextTheme = theme === "dark" ? "light" : "dark";
    return (
      <Button
        variant="outline"
        size="sm"
        className="w-full justify-start"
        onClick={() => setTheme(nextTheme)}
      >
        {theme === "dark" ? (
          <span className="inline-flex items-center">
            <Sun className="h-4 w-4 mr-2" />
            {t.toggleTheme}
          </span>
        ) : (
          <span className="inline-flex items-center">
            <Moon className="h-4 w-4 mr-2" />
            {t.toggleTheme}
          </span>
        )}
      </Button>
    );
  };

  const renderAuthControls = (
    closeMenu?: () => void,
    mobile?: boolean
  ) => {
    if (loading) {
      return null;
    }

    if (!user) {
      return (
        <Button
          variant="default"
          size="sm"
          className="w-full justify-start"
          onClick={() => {
            if (closeMenu) {
              closeMenu();
            }
            void signIn();
          }}
        >
          {t.signIn}
        </Button>
      );
    }

    const displayName = user.firstName || user.username || t.anonymous;

    return (
      <div className={`flex items-center ${mobile ? "w-full" : "gap-3"}`}>
        <div className="flex items-center gap-2">
          <Avatar className="h-8 w-8">
            {user.imageUrl ? (
              <AvatarImage src={user.imageUrl} alt={displayName} />
            ) : (
              <AvatarFallback className="text-xs">{userInitial}</AvatarFallback>
            )}
          </Avatar>
          <span className="text-sm font-medium">{displayName}</span>
        </div>
        <Button
          variant="outline"
          size="sm"
          className={mobile ? "ml-auto" : ""}
          onClick={() => {
            if (closeMenu) {
              closeMenu();
            }
            void signOut();
          }}
        >
          {t.signOut}
        </Button>
      </div>
    );
  };

  const Controls = ({
    closeMenu,
    mobile,
  }: { closeMenu?: () => void; mobile?: boolean } = {}) => (
    <>
      {pathname !== "/news" && (
        <div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              router.push("/news");
              if (closeMenu) closeMenu();
            }}
            className="w-full justify-start"
          >
            <Newspaper className="h-4 w-4 mr-2" />
            {t.getNews}
          </Button>
        </div>
      )}
      {mobile ? (
        <>
          <MobileLanguageToggle />
          <MobileThemeToggle />
        </>
      ) : (
        <>
          <LanguageToggle />
          <ThemeToggle />
        </>
      )}
      {renderAuthControls(closeMenu, mobile)}
    </>
  );

  return (
    <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
      <div className="mx-auto max-w-7xl px-4 md:px-6">
        <div className="flex h-16 items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <SearchCheck className="h-5 w-5" />
            </div>
            <span className="text-xl font-bold">Checkmate</span>
          </Link>
          <div className="hidden sm:flex items-center gap-3">
            <Controls />
          </div>
          <div className="sm:hidden">
            <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="outline" size="icon" aria-label="Open menu">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent
                side="right"
                className="flex flex-col gap-4 w-56 pt-8"
              >
                <Controls closeMenu={() => setMenuOpen(false)} mobile />
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </header>
  );
}
