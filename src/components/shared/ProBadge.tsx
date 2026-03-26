"use client";

import { cn } from "@/lib/utils";

interface ProBadgeProps {
  size?: "sm" | "md";
  className?: string;
}

/**
 * "PRO" pill badge — black text on green background.
 * size="sm" → Navbar, size="md" → Profile page.
 */
export function ProBadge({ size = "sm", className }: ProBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center font-bold tracking-wide rounded-full select-none",
        "bg-[var(--music-accent)] text-black",
        size === "sm" && "text-[9px] px-2 py-0.5",
        size === "md" && "text-[11px] px-2.5 py-1",
        className
      )}
    >
      PRO
    </span>
  );
}
