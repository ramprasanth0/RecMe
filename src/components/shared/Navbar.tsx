"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { User, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";

interface NavbarProps {
  user?: { display_name: string | null; avatar_url: string | null } | null;
}

const NAV_LINKS = [
  { href: "/home", label: "Dashboard" },
  { href: "/chat", label: "Chat" },
  { href: "/profile", label: "Profile" },
];

export function Navbar({ user }: NavbarProps) {
  const pathname = usePathname();

  return (
    <nav className="fixed top-0 left-0 right-0 z-40 grid grid-cols-3 items-center px-6 py-4 border-b border-white/5 bg-background/80 backdrop-blur-md">
      {/* Logo — left */}
      <Link href="/" className="flex items-center gap-2 justify-self-start">
        <span className="font-display text-xl font-bold tracking-tight">
          Rec<span className="text-[var(--music-accent)]">Me</span>
        </span>
      </Link>

      {/* Nav links — center */}
      <div className="flex items-center justify-center gap-1">
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
                    ? "text-foreground bg-white/8"
                    : "text-muted-foreground hover:text-foreground hover:bg-white/5"
                )}
              >
                {label}
              </Link>
            );
          })
        ) : null}
      </div>

      {/* Profile — right */}
      <div className="flex items-center gap-3 justify-self-end">
        {user ? (
          <>
            <Link
              href="/profile"
              className={cn(
                "w-9 h-9 rounded-full flex items-center justify-center",
                "bg-surface-light border border-white/5 hover:border-white/10 transition-colors",
                pathname === "/profile" && "border-white/20"
              )}
            >
              {user.avatar_url ? (
                <Image
                  src={user.avatar_url}
                  alt=""
                  width={36}
                  height={36}
                  className="w-full h-full rounded-full object-cover"
                />
              ) : (
                <User className="w-4 h-4 text-muted-foreground" />
              )}
            </Link>
            <form action="/api/auth/logout" method="POST">
              <button
                type="submit"
                className="w-9 h-9 rounded-full flex items-center justify-center bg-surface-light border border-white/5 hover:border-white/10 transition-colors"
              >
                <LogOut className="w-4 h-4 text-muted-foreground" />
              </button>
            </form>
          </>
        ) : (
          <Link
            href="/api/auth/spotify/start"
            className="text-sm px-4 py-2 rounded-full bg-[var(--music-accent)] text-black font-medium hover:brightness-110 transition-all"
          >
            Sign in
          </Link>
        )}
      </div>
    </nav>
  );
}
