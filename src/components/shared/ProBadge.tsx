"use client";

import { cn } from "@/lib/utils";
import Image from "next/image";
import { User } from "lucide-react";

interface ProBadgeProps {
  avatarUrl?: string | null;
  size?: "sm" | "md" | "lg";
  className?: string;
}

/**
 * "PRO" pill badge — green background with "PRO" text on the left,
 * and the user's profile picture incorporated into the pill on the right.
 */
export function ProBadge({ avatarUrl, size = "md", className }: ProBadgeProps) {
  const dimensions = {
    sm: { h: "h-8", pl: "pl-3", pr: "pr-8", textSize: "text-[10px]", avatarSize: 32, iconSize: "w-4 h-4" },
    md: { h: "h-11", pl: "pl-4", pr: "pr-11", textSize: "text-xs", avatarSize: 44, iconSize: "w-5 h-5" },
    lg: { h: "h-12", pl: "pl-5", pr: "pr-12", textSize: "text-sm", avatarSize: 48, iconSize: "w-6 h-6" },
  }[size];

  return (
    <div
      className={cn(
        "relative inline-flex items-center rounded-full bg-[var(--music-accent)] text-black shadow-sm select-none",
        dimensions.h,
        dimensions.pl,
        dimensions.pr,
        className
      )}
    >
      <span className={cn("font-bold tracking-wide", dimensions.textSize)}>PRO</span>
      
      <div 
        className="absolute right-0 top-0 bottom-0 aspect-square rounded-full border-2 border-[var(--music-accent)] overflow-hidden bg-surface-light flex items-center justify-center shrink-0"
      >
        {avatarUrl ? (
          <Image
            src={avatarUrl}
            alt=""
            width={dimensions.avatarSize}
            height={dimensions.avatarSize}
            className="w-full h-full object-cover"
          />
        ) : (
          <User className={cn("text-muted-foreground", dimensions.iconSize)} />
        )}
      </div>
    </div>
  );
}
