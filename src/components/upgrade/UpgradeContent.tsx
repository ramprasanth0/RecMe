"use client";

import Link from "next/link";
import { Check, X, Sparkles, Crown } from "lucide-react";
import { cn } from "@/lib/utils";
import { ProBadge } from "@/components/shared/ProBadge";

interface UpgradeContentProps {
  isPro: boolean;
  isAuthenticated: boolean;
}

const STANDARD_FEATURES = [
  { label: "AI Music & Movie Recommendations", included: true },
  { label: "Trending Charts (US & India)", included: true },
  { label: "Save Recommendations", included: true },
  { label: "Genre Preferences", included: true },
  { label: "Spotify Integration", included: true },
  { label: "AI Playlist Generator", included: false },
];

const PRO_FEATURES_LIST = [
  { label: "AI Music & Movie Recommendations", included: true },
  { label: "Trending Charts (US & India)", included: true },
  { label: "Save Recommendations", included: true },
  { label: "Genre Preferences", included: true },
  { label: "Spotify Integration", included: true },
  { label: "AI Playlist Generator", included: true, highlight: true },
];

export function UpgradeContent({ isPro, isAuthenticated }: UpgradeContentProps) {
  return (
    <main className="min-h-screen pt-24 px-4 sm:px-6 pb-16">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="font-display text-3xl sm:text-4xl font-bold mb-3">
            Choose Your Plan
          </h1>
          <p className="text-muted-foreground text-sm sm:text-base max-w-md mx-auto">
            Unlock powerful AI features to supercharge your music experience.
          </p>
        </div>

        {/* Plan cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl mx-auto">
          {/* Standard */}
          <div className="rounded-2xl bg-surface border border-border p-6 sm:p-8 flex flex-col">
            <div className="mb-6">
              <h2 className="text-lg font-semibold mb-1">Standard</h2>
              <p className="text-sm text-muted-foreground">
                Everything you need to discover great content
              </p>
            </div>

            <div className="mb-6">
              <span className="text-3xl font-bold">Free</span>
            </div>

            <ul className="space-y-3 flex-1 mb-8">
              {STANDARD_FEATURES.map(({ label, included }) => (
                <li key={label} className="flex items-center gap-2.5 text-sm">
                  {included ? (
                    <Check className="w-4 h-4 text-[var(--music-accent)] shrink-0" />
                  ) : (
                    <X className="w-4 h-4 text-muted-foreground/40 shrink-0" />
                  )}
                  <span className={cn(!included && "text-muted-foreground/50 line-through")}>
                    {label}
                  </span>
                </li>
              ))}
            </ul>

            <div
              className="text-center text-sm py-3 rounded-lg bg-surface-light border border-border text-muted-foreground"
            >
              {isPro ? "Your previous plan" : "Current plan"}
            </div>
          </div>

          {/* Pro */}
          <div className="rounded-2xl bg-surface border-2 border-[var(--music-accent)] p-6 sm:p-8 flex flex-col relative overflow-hidden">
            {/* Recommended badge */}
            <div className="absolute top-0 right-0">
              <div className="bg-[var(--music-accent)] text-black text-[10px] font-bold px-3 py-1 rounded-bl-lg">
                RECOMMENDED
              </div>
            </div>

            <div className="mb-6">
              <div className="flex items-center gap-2 mb-1">
                <h2 className="text-lg font-semibold">Pro</h2>
                <ProBadge size="sm" />
              </div>
              <p className="text-sm text-muted-foreground">
                Unlock AI-powered music creation tools
              </p>
            </div>

            <div className="mb-6">
              <span className="text-3xl font-bold">₹299</span>
              <span className="text-sm text-muted-foreground ml-1">one-time</span>
            </div>

            <ul className="space-y-3 flex-1 mb-8">
              {PRO_FEATURES_LIST.map(({ label, highlight }) => (
                <li key={label} className="flex items-center gap-2.5 text-sm">
                  <Check
                    className={cn(
                      "w-4 h-4 shrink-0",
                      highlight ? "text-[var(--music-accent)]" : "text-[var(--music-accent)]"
                    )}
                  />
                  <span className={cn(highlight && "font-medium text-[var(--music-accent)]")}>
                    {label}
                  </span>
                  {highlight && (
                    <Sparkles className="w-3 h-3 text-[var(--music-accent)] ml-auto shrink-0" />
                  )}
                </li>
              ))}
            </ul>

            {isPro ? (
              <div className="text-center text-sm py-3 rounded-lg bg-[var(--music-accent)]/10 border border-[var(--music-accent)]/20 text-[var(--music-accent)] font-medium flex items-center justify-center gap-2">
                <Crown className="w-4 h-4" />
                You&apos;re on Pro
              </div>
            ) : (
              <button
                disabled
                className="w-full py-3 rounded-lg text-sm font-semibold bg-[var(--music-accent)] text-black hover:brightness-110 transition-all disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <Sparkles className="w-4 h-4" />
                Coming Soon
              </button>
            )}

            {!isPro && (
              <p className="text-[10px] text-muted-foreground/50 text-center mt-2">
                Payment via Razorpay — launching soon
              </p>
            )}
          </div>
        </div>

        {/* Back link */}
        <div className="text-center mt-10">
          <Link
            href={isAuthenticated ? "/personalize" : "/"}
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            ← Back to {isAuthenticated ? "Personalize" : "Home"}
          </Link>
        </div>
      </div>
    </main>
  );
}
