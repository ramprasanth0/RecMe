"use client";

import Link from "next/link";
import Image from "next/image";
import { User, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";

interface NavbarProps {
  user?: { display_name: string | null; avatar_url: string | null } | null;
}

export function Navbar({ user }: NavbarProps) {
  return (
    <nav className="fixed top-0 left-0 right-0 z-40 flex items-center justify-between px-6 py-4">
      {/* Logo */}
      <Link href="/" className="flex items-center gap-2">
        <span className="font-display text-xl font-bold tracking-tight">
          Rec<span className="text-[var(--music-accent)]">Me</span>
        </span>
      </Link>

      {/* Profile */}
      <div className="flex items-center gap-3">
        {user ? (
          <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground hidden sm:block">
              {user.display_name}
            </span>
            <Link
              href="/profile"
              className={cn(
                "w-9 h-9 rounded-full flex items-center justify-center",
                "bg-surface-light border border-white/5 hover:border-white/10 transition-colors"
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
          </div>
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
