"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { MusicRecommendationSchema, MovieRecommendationSchema } from "@/types/recommendations";
import type { MusicItem, MovieItem } from "@/types/recommendations";

// Module-level cache — survives component unmount/remount within the same browser tab
const autoRecCache: Partial<Record<"music" | "movie", MusicItem[] | MovieItem[]>> = {};
const searchRecCache: Partial<Record<"music" | "movie", MusicItem[] | MovieItem[]>> = {};

interface UseRecommendationsOptions {
  type: "music" | "movie";
  topArtists?: string[];
  topTracks?: string[];
  favoriteGenres?: string[];
  movieGenres?: string[];
  /** If true, fetch automatically on mount using autoPrompt */
  autoFetch?: boolean;
  autoPrompt?: string;
}

interface UseRecommendationsReturn {
  autoItems: MusicItem[] | MovieItem[];
  searchedItems: MusicItem[] | MovieItem[];
  isLoading: boolean;
  isAutoLoading: boolean;
  error: string | null;
  lastMood: string | null;
  fetchRecs: (mood: string) => Promise<void>;
  /** Trigger the auto-fetch silently (no lastMood set) — safe to call multiple times; fires once */
  triggerAutoFetch: () => void;
}

export function useRecommendations(
  options: UseRecommendationsOptions
): UseRecommendationsReturn {
  const [autoItems, setAutoItems] = useState<MusicItem[] | MovieItem[]>(
    () => autoRecCache[options.type] ?? []
  );
  const [searchedItems, setSearchedItems] = useState<MusicItem[] | MovieItem[]>(
    () => searchRecCache[options.type] ?? []
  );
  const [isLoading, setIsLoading] = useState(false);
  const [isAutoLoading, setIsAutoLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastMood, setLastMood] = useState<string | null>(null);
  const hasFetched = useRef(!!autoRecCache[options.type]);

  const fetchRecs = useCallback(
    async (mood: string, silent = false) => {
      if (silent) setIsAutoLoading(true);
      else setIsLoading(true);
      setError(null);
      if (!silent) setLastMood(mood);

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
            if (silent) {
              setAutoItems(validated.items);
              autoRecCache["music"] = validated.items;
            } else {
              setSearchedItems(validated.items);
              searchRecCache["music"] = validated.items;
            }
          } else {
            const validated = MovieRecommendationSchema.parse({ type: "movie", items: data.items });
            if (silent) {
              setAutoItems(validated.items);
              autoRecCache["movie"] = validated.items;
            } else {
              setSearchedItems(validated.items);
              searchRecCache["movie"] = validated.items;
            }
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
          if (silent) {
             setAutoItems(validated.items);
             autoRecCache["music"] = validated.items;
          } else {
             setSearchedItems(validated.items);
             searchRecCache["music"] = validated.items;
          }
        } else {
          const validated = MovieRecommendationSchema.parse(parsed);
          if (silent) {
             setAutoItems(validated.items);
             autoRecCache["movie"] = validated.items;
          } else {
             setSearchedItems(validated.items);
             searchRecCache["movie"] = validated.items;
          }
        }
      } catch (err) {
        console.error("Recommendation fetch error:", err);
        setError(err instanceof Error ? err.message : "Something went wrong");
      } finally {
        setIsLoading(false);
        setIsAutoLoading(false);
      }
    },
    [options.type]
  );

  // Auto-fetch once on mount when requested
  useEffect(() => {
    if (options.autoFetch && options.autoPrompt && !hasFetched.current) {
      hasFetched.current = true;
      fetchRecs(options.autoPrompt, true); // silent=true keeps lastMood null → shows "Picked for you"
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Callable trigger for deferred auto-fetch (e.g. when a tab is first opened)
  const triggerAutoFetch = useCallback(() => {
    if (!options.autoPrompt || hasFetched.current) return;
    hasFetched.current = true;
    fetchRecs(options.autoPrompt, true);
  }, [fetchRecs, options.autoPrompt]);

  return { autoItems, searchedItems, isLoading, isAutoLoading, error, lastMood, fetchRecs, triggerAutoFetch };
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
