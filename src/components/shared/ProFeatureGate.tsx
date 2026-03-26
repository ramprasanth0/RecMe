"use client";

import Link from "next/link";
import { Lock, Sparkles } from "lucide-react";
import { PRO_FEATURES } from "@/config/pro";

interface ProFeatureGateProps {
  featureId: string;
  isPro: boolean;
  children: React.ReactNode;
}

/**
 * Wraps a Pro-only feature. If the user is NOT Pro:
 * - Content is blurred with pointer-events disabled
 * - A centered overlay shows the feature name + "Unlock with Pro" CTA
 */
export function ProFeatureGate({ featureId, isPro, children }: ProFeatureGateProps) {
  if (isPro) {
    return <>{children}</>;
  }

  const feature = PRO_FEATURES[featureId];

  return (
    <div className="relative rounded-xl overflow-hidden">
      {/* Blurred content */}
      <div
        className="pointer-events-none select-none"
        style={{ filter: "blur(5px)" }}
        aria-hidden="true"
      >
        {children}
      </div>

      {/* Lock overlay */}
      <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 bg-background/60 backdrop-blur-[2px] rounded-xl">
        <div className="w-12 h-12 rounded-full bg-[var(--music-accent)]/10 flex items-center justify-center">
          <Lock className="w-5 h-5 text-[var(--music-accent)]" />
        </div>

        <div className="text-center space-y-1 px-4">
          <p className="text-sm font-semibold">
            {feature?.label || "Pro Feature"}
          </p>
          <p className="text-xs text-muted-foreground max-w-[260px]">
            {feature?.description || "This feature is available with RecMe Pro."}
          </p>
        </div>

        <Link
          href="/upgrade"
          className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-full bg-[var(--music-accent)] text-black text-sm font-semibold hover:brightness-110 transition-all"
        >
          <Sparkles className="w-3.5 h-3.5" />
          Unlock with Pro
        </Link>
      </div>
    </div>
  );
}
