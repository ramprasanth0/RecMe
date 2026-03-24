"use client";

import { useState } from "react";
import { Sparkles, TrendingUp } from "lucide-react";
import { MoodInput } from "@/components/shared/MoodInput";
import { RecommendationCard } from "@/components/shared/RecommendationCard";
import type { MusicItem } from "@/types/recommendations";

const SAMPLE_RECS: MusicItem[] = [
  { title: "Blinding Lights", artist: "The Weeknd", reason: "Cinematic synths that match late-night energy" },
  { title: "Redbone", artist: "Childish Gambino", reason: "Smooth funk with a dreamy, nostalgic pull" },
  { title: "Pink + White", artist: "Frank Ocean", reason: "Warm and reflective — perfect for winding down" },
  { title: "Electric Feel", artist: "MGMT", reason: "Bright indie pop with irresistible groove" },
  { title: "Midnight City", artist: "M83", reason: "Euphoric synth-pop that feels like a night drive" },
  { title: "Do I Wanna Know?", artist: "Arctic Monkeys", reason: "Dark, brooding rock with a magnetic riff" },
  { title: "Nights", artist: "Frank Ocean", reason: "Genre-defying mood piece with a legendary beat switch" },
  { title: "Tadow", artist: "Masego & FKJ", reason: "Jazz-funk fusion that's effortlessly cool" },
];

const TRENDING: MusicItem[] = [
  { title: "Die With A Smile", artist: "Lady Gaga & Bruno Mars", reason: "Chart-topping power ballad" },
  { title: "Birds of a Feather", artist: "Billie Eilish", reason: "Intimate alt-pop at its finest" },
  { title: "Espresso", artist: "Sabrina Carpenter", reason: "Infectious pop earworm" },
  { title: "Good Luck, Babe!", artist: "Chappell Roan", reason: "Anthemic synth-pop breakthrough" },
  { title: "Lunch", artist: "Billie Eilish", reason: "Bold and playful pop energy" },
  { title: "Taste", artist: "Sabrina Carpenter", reason: "Cheeky pop with killer hooks" },
];

export function MusicTab() {
  const [recs] = useState<MusicItem[]>(SAMPLE_RECS);
  const [isLoading, setIsLoading] = useState(false);
  const [lastMood, setLastMood] = useState<string | null>(null);

  const handleMoodSubmit = async (mood: string) => {
    setIsLoading(true);
    setLastMood(mood);
    // Phase 5: Replace with actual Gemini API call
    setTimeout(() => {
      setIsLoading(false);
    }, 1500);
  };

  return (
    <div className="space-y-10">
      {/* Mood input */}
      <MoodInput
        activeTab="music"
        onSubmit={handleMoodSubmit}
        isLoading={isLoading}
      />

      {/* AI Recommendations */}
      <section>
        <div className="flex items-center gap-2 mb-5">
          <Sparkles className="w-4 h-4 text-music-accent" />
          <h2 className="text-base font-semibold">
            {lastMood ? `Recommendations for "${lastMood}"` : "Picked for you"}
          </h2>
          <span className="text-[10px] font-mono text-muted-foreground px-1.5 py-0.5 rounded bg-music-accent/10 text-music-accent ml-auto">
            AI
          </span>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="rounded-xl bg-surface border border-white/5 overflow-hidden">
                <div className="aspect-square bg-surface-light animate-pulse" />
                <div className="p-3 space-y-2">
                  <div className="h-3 bg-surface-light rounded animate-pulse w-3/4" />
                  <div className="h-2 bg-surface-light rounded animate-pulse w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {recs.map((item, i) => (
              <RecommendationCard key={i} type="music" item={item} />
            ))}
          </div>
        )}
      </section>

      {/* Trending */}
      <section>
        <div className="flex items-center gap-2 mb-5">
          <TrendingUp className="w-4 h-4 text-muted-foreground" />
          <h2 className="text-base font-semibold">Trending now</h2>
        </div>

        <div className="flex gap-4 overflow-x-auto hide-scrollbar pb-2">
          {TRENDING.map((item, i) => (
            <div key={i} className="shrink-0 w-[160px]">
              <RecommendationCard type="music" item={item} />
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
