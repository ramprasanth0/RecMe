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
        const res = await fetch("/api/gemini", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            type: options.type,
            mood,
            topArtists: options.topArtists,
            topTracks: options.topTracks,
            favoriteGenres: options.favoriteGenres,
            movieGenres: options.movieGenres,
          }),
        });

        if (!res.ok) throw new Error("Failed to get recommendations");
        if (!res.body) throw new Error("No response body");

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let accumulated = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split("\n");

          for (const line of lines) {
            if (line.startsWith("data: ")) {
              const data = line.slice(6);
              if (data === "[DONE]") break;

              try {
                const parsed = JSON.parse(data);
                if (parsed.text) {
                  accumulated += parsed.text;
                }
                if (parsed.error) {
                  setError(parsed.error);
                }
              } catch {
                // Incomplete JSON chunk, skip
              }
            }
          }
        }

        // Parse the complete accumulated response
        const jsonStr = extractJSON(accumulated);
        if (jsonStr) {
          const parsed = JSON.parse(jsonStr);

          if (options.type === "music") {
            const validated = MusicRecommendationSchema.parse(parsed);
            setItems(validated.items);
          } else {
            const validated = MovieRecommendationSchema.parse(parsed);
            setItems(validated.items);
          }
        } else {
          setError("Could not parse AI response");
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

/** Extract JSON object from a string that might have surrounding text */
function extractJSON(text: string): string | null {
  // Try parsing directly first
  try {
    JSON.parse(text.trim());
    return text.trim();
  } catch {
    // Try to find JSON object in the text
    const start = text.indexOf("{");
    const end = text.lastIndexOf("}");
    if (start !== -1 && end !== -1 && end > start) {
      const candidate = text.slice(start, end + 1);
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
