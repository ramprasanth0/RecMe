"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { User, LogOut, Menu, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";

interface NavbarProps {
  user?: { display_name: string | null; avatar_url: string | null } | null;
}

// Module-level flag — persists for the tab session, prevents re-animation on route change
let logoAnimationDone = false;

const NAV_LINKS = [
  { href: "/", label: "Home" },
  { href: "/personalize", label: "Personalize" },
  { href: "/profile", label: "Profile" },
];

export function Navbar({ user }: NavbarProps) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [logoExpanded, setLogoExpanded] = useState(false);
  // "idle" | "expanding" | "crushing"
  const [logoPhase, setLogoPhase] = useState<"idle" | "expanding" | "crushing">("idle");

  // One-shot brand animation: RecMe → RecommendMe → RecMe (page load only, not on route change)
  useEffect(() => {
    if (logoAnimationDone) return;
    logoAnimationDone = true;
    const expand = setTimeout(() => {
      setLogoExpanded(true);
      setLogoPhase("expanding");
    }, 1000);
    const collapse = setTimeout(() => {
      setLogoExpanded(false);
      setLogoPhase("crushing");
      setTimeout(() => setLogoPhase("idle"), 500);
    }, 3200);
    return () => {
      clearTimeout(expand);
      clearTimeout(collapse);
    };
  }, []);

  return (
    <>
      <nav className="fixed top-0 left-0 right-0 z-40 flex items-center px-6 py-4 border-b border-border bg-background backdrop-blur-md shadow-sm dark:shadow-none dark:bg-background/80">
        {/* Logo — left */}
        <Link href="/" className="flex items-center gap-2 shrink-0" onClick={() => setMobileOpen(false)}>
          {/* Whole logo drifts right on expand, slides back in sync with ommend collapse */}
          <motion.span
            animate={logoPhase === "expanding" ? { x: 4 } : { x: 0 }}
            transition={{ duration: 0.55, ease: [0.4, 0, 0.2, 1] }}
            className="font-display text-xl font-bold tracking-tight flex items-baseline overflow-hidden"
          >
            Rec
            <motion.span
              initial={{ maxWidth: 0, opacity: 0 }}
              animate={{ maxWidth: logoExpanded ? 90 : 0, opacity: logoExpanded ? 1 : 0 }}
              transition={{ duration: 0.55, ease: [0.4, 0, 0.2, 1] }}
              className="inline-block overflow-hidden whitespace-nowrap"
            >
              ommend
            </motion.span>
            <span className="text-[var(--music-accent)]">Me</span>
          </motion.span>
        </Link>

        {/* Nav links — center (hidden on mobile, flex-1 keeps them centered on desktop) */}
        <div className="hidden sm:flex flex-1 items-center justify-center gap-1">
          {user ? (
            NAV_LINKS.map(({ href, label }) => {
              const isActive = pathname === href;
              return (
                <Link
                  key={href}
                  href={href}
                  className={cn(
                    "text-sm px-3 py-1.5 rounded-lg transition-colors",
                    isActive
                      ? "text-foreground bg-black/[0.06] dark:bg-white/8"
                      : "text-muted-foreground hover:text-foreground hover:bg-black/[0.04] dark:hover:bg-white/5"
                  )}
                >
                  {label}
                </Link>
              );
            })
          ) : null}
        </div>

        {/* Right side — ml-auto pushes to far right on mobile when center is hidden */}
        <div className="flex items-center gap-2 ml-auto">
          {user ? (
            <>
              {/* Hamburger — mobile only */}
              <button
                className="sm:hidden w-11 h-11 rounded-full flex items-center justify-center bg-surface-light border border-border hover:border-border transition-colors"
                onClick={() => setMobileOpen((v) => !v)}
                aria-label="Toggle menu"
                aria-expanded={mobileOpen}
              >
                {mobileOpen ? (
                  <X className="w-4 h-4 text-muted-foreground" />
                ) : (
                  <Menu className="w-4 h-4 text-muted-foreground" />
                )}
              </button>

              {/* Profile avatar — desktop only */}
              <Link
                href="/profile"
                className={cn(
                  "hidden sm:flex w-11 h-11 rounded-full items-center justify-center",
                  "bg-surface-light border border-border hover:border-border transition-colors",
                  pathname === "/profile" && "border-border"
                )}
              >
                {user.avatar_url ? (
                  <Image
                    src={user.avatar_url}
                    alt=""
                    width={44}
                    height={44}
                    className="w-full h-full rounded-full object-cover"
                  />
                ) : (
                  <User className="w-4 h-4 text-muted-foreground" />
                )}
              </Link>
              <form action="/api/auth/logout" method="POST" className="hidden sm:block">
                <button
                  type="submit"
                  className="w-11 h-11 rounded-full flex items-center justify-center bg-surface-light border border-border hover:border-border transition-colors"
                >
                  <LogOut className="w-4 h-4 text-muted-foreground" />
                </button>
              </form>
            </>
          ) : (
            <Link
              href="/signin"
              className="text-sm px-4 py-2.5 rounded-full bg-[var(--music-accent)] text-black font-medium hover:brightness-110 transition-all"
            >
              Sign in
            </Link>
          )}
        </div>
      </nav>

      {/* Mobile dropdown menu */}
      <AnimatePresence>
        {mobileOpen && user && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.15 }}
            className="fixed top-[73px] left-0 right-0 z-30 sm:hidden bg-background border-b border-border shadow-lg"
          >
            <div className="flex flex-col py-2">
              {NAV_LINKS.map(({ href, label }) => {
                const isActive = pathname === href;
                return (
                  <Link
                    key={href}
                    href={href}
                    onClick={() => setMobileOpen(false)}
                    className={cn(
                      "text-sm px-6 py-3.5 transition-colors",
                      isActive
                        ? "text-foreground bg-black/[0.06] dark:bg-white/8 font-medium"
                        : "text-muted-foreground hover:text-foreground hover:bg-black/[0.04] dark:hover:bg-white/5"
                    )}
                  >
                    {label}
                  </Link>
                );
              })}
              <div className="border-t border-border mt-2 pt-2 px-4 pb-2 flex items-center justify-between">
                <Link
                  href="/profile"
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center gap-3 py-2"
                >
                  <div className="w-8 h-8 rounded-full bg-surface-light border border-border flex items-center justify-center overflow-hidden">
                    {user.avatar_url ? (
                      <Image src={user.avatar_url} alt="" width={32} height={32} className="w-full h-full object-cover" />
                    ) : (
                      <User className="w-3.5 h-3.5 text-muted-foreground" />
                    )}
                  </div>
                  <span className="text-sm text-muted-foreground">{user.display_name ?? "Profile"}</span>
                </Link>
                <form action="/api/auth/logout" method="POST">
                  <button
                    type="submit"
                    className="flex items-center gap-2 text-sm text-muted-foreground py-2 px-3 rounded-lg hover:text-foreground transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                    Sign out
                  </button>
                </form>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
