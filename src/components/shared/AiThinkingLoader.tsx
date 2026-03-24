"use client";

import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";

const MUSIC_STEPS = [
  "Tuning into your listening history…",
  "Cross-referencing mood with your top artists…",
  "Surfacing hidden gems you'll love…",
  "Cooking something special for you…",
];

const MOVIE_STEPS = [
  "Reading between the frames…",
  "Matching your vibe to the perfect films…",
  "Digging through the archives…",
  "Cooking something special for you…",
];

interface AiThinkingLoaderProps {
  type: "music" | "movie";
  count?: number;
}

export function AiThinkingLoader({ type, count = 10 }: AiThinkingLoaderProps) {
  const steps = type === "music" ? MUSIC_STEPS : MOVIE_STEPS;
  const accent = type === "music" ? "var(--music-accent)" : "var(--movie-accent)";
  const [stepIndex, setStepIndex] = useState(0);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => {
      setVisible(false);
      setTimeout(() => {
        setStepIndex((i) => (i + 1) % steps.length);
        setVisible(true);
      }, 300);
    }, 2800);
    return () => clearInterval(interval);
  }, [steps.length]);

  return (
    <div className="space-y-6">
      {/* Animated status message */}
      <div className="flex flex-col items-center gap-3 py-6">
        {/* Pulsing orb */}
        <div className="relative flex items-center justify-center w-12 h-12">
          <span
            className="absolute inline-flex h-full w-full rounded-full opacity-30 animate-ping"
            style={{ backgroundColor: accent }}
          />
          <span
            className="relative inline-flex rounded-full w-6 h-6"
            style={{ backgroundColor: accent }}
          />
        </div>

        {/* Cycling message */}
        <p
          className={cn(
            "text-sm font-mono text-center transition-opacity duration-300",
            visible ? "opacity-100" : "opacity-0"
          )}
          style={{ color: accent }}
        >
          {steps[stepIndex]}
        </p>

        {/* Step dots */}
        <div className="flex gap-1.5 mt-1">
          {steps.map((_, i) => (
            <span
              key={i}
              className="w-1.5 h-1.5 rounded-full transition-all duration-300"
              style={{
                backgroundColor: i === stepIndex ? accent : "var(--border)",
                transform: i === stepIndex ? "scale(1.3)" : "scale(1)",
              }}
            />
          ))}
        </div>
      </div>

      {/* Skeleton cards */}
      <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
        {Array.from({ length: count }).map((_, i) => (
          <div
            key={i}
            className="rounded-xl bg-surface border border-border overflow-hidden"
            style={{ animationDelay: `${i * 60}ms` }}
          >
            <div
              className={cn(
                "bg-surface-light animate-pulse",
                type === "music" ? "aspect-square" : "aspect-[2/3]"
              )}
            />
            <div className="p-3 space-y-2">
              <div className="h-3 bg-surface-light rounded animate-pulse w-3/4" />
              <div className="h-2 bg-surface-light rounded animate-pulse w-1/2" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
