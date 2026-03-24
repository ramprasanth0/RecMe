"use client";

import { useState, useCallback } from "react";
import { MusicRecommendationSchema, MovieRecommendationSchema } from "@/types/recommendations";
import type { MusicItem, MovieItem } from "@/types/recommendations";

interface UseRecommendationsOptions {
  type: "music" | "movie";
  topArtists?: string[];
  topTracks?: string[];
  favoriteGenres?: string[];
  movieGenres?: string[];
}

interface UseRecommendationsReturn {
  items: MusicItem[] | MovieItem[];
  isLoading: boolean;
  error: string | null;
  lastMood: string | null;
  fetchRecs: (mood: string) => Promise<void>;
}

export function useRecommendations(
  options: UseRecommendationsOptions
): UseRecommendationsReturn {
  const [items, setItems] = useState<MusicItem[] | MovieItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastMood, setLastMood] = useState<string | null>(null);

  const fetchRecs = useCallback(
    async (mood: string) => {
      setIsLoading(true);
      setError(null);
      setLastMood(mood);

      try {
        const res = await fetch("/api/gemini/recommend", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ type: options.type, mood }),
        });

        if (!res.ok) throw new Error("Failed to get recommendations");

        const data = await res.json();

        // Server-side enriched response: { type, items }
        if (data.items) {
          if (options.type === "music") {
            const validated = MusicRecommendationSchema.parse({ type: "music", items: data.items });
            setItems(validated.items);
          } else {
            const validated = MovieRecommendationSchema.parse({ type: "movie", items: data.items });
            setItems(validated.items);
          }
          return;
        }

        // Legacy text response fallback
        const { text } = data;
        if (!text) throw new Error("Empty response from AI");

        const jsonStr = extractJSON(text);
        if (!jsonStr) {
          console.error("extractJSON failed, text:", text.slice(0, 300));
          setError("Could not parse AI response");
          return;
        }

        const parsed = JSON.parse(jsonStr);

        if (options.type === "music") {
          const validated = MusicRecommendationSchema.parse(parsed);
          setItems(validated.items);
        } else {
          const validated = MovieRecommendationSchema.parse(parsed);
          setItems(validated.items);
        }
      } catch (err) {
        console.error("Recommendation fetch error:", err);
        setError(err instanceof Error ? err.message : "Something went wrong");
      } finally {
        setIsLoading(false);
      }
    },
    [options.type, options.topArtists, options.topTracks, options.favoriteGenres, options.movieGenres]
  );

  return { items, isLoading, error, lastMood, fetchRecs };
}

/** Extract JSON object from a string that might have surrounding text or markdown fences */
function extractJSON(text: string): string | null {
  // Strip markdown code fences Gemini sometimes adds
  const cleaned = text.replace(/```(?:json)?\n?/g, "").trim();

  // Try parsing directly first
  try {
    JSON.parse(cleaned);
    return cleaned;
  } catch {
    // Find outermost JSON object boundaries
    const start = cleaned.indexOf("{");
    const end = cleaned.lastIndexOf("}");
    if (start !== -1 && end !== -1 && end > start) {
      const candidate = cleaned.slice(start, end + 1);
      try {
        JSON.parse(candidate);
        return candidate;
      } catch {
        return null;
      }
    }
    return null;
  }
}
