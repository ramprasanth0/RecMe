export const maxDuration = 45; // allow time for AI + TMDB enrichment

import { NextRequest } from "next/server";
import { getGeminiClient, AI_MODEL } from "@/lib/gemini";
import { buildSystemPrompt } from "@/lib/gemini/prompt";
import { z } from "zod/v4";
import { getCurrentUser } from "@/lib/auth/session";
import { getTopArtists, getTopTracks } from "@/lib/spotify";
import { searchMovieTMDB } from "@/lib/tmdb";
import { MovieRecommendationSchema, MusicRecommendationSchema } from "@/types/recommendations";
import { createAdminClient } from "@/lib/supabase/admin";

const RequestSchema = z.object({
  type: z.enum(["music", "movie"]),
  mood: z.string().min(1).max(500),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = RequestSchema.parse(body);

    // Auto-inject Spotify data + preferences if user is authenticated
    let topArtists: string[] | undefined;
    let topTracks: string[] | undefined;
    let favoriteGenres: string[] | undefined;
    let movieGenres: string[] | undefined;
    let userId: string | undefined;

    try {
      const user = await getCurrentUser();
      if (user) userId = user.id;
      if (user?.spotify_access_token) {
        const [artists, tracks] = await Promise.all([
          getTopArtists(user.spotify_access_token, 10),
          getTopTracks(user.spotify_access_token, 10),
        ]);
        topArtists = artists.map((a: { name: string }) => a.name);
        topTracks = tracks.map(
          (t: { name: string; artists: { name: string }[] }) =>
            `${t.name} by ${t.artists[0]?.name}`
        );
      }
      if (user?.preferences) {
        const prefs = user.preferences as { music_genres?: string[]; movie_genres?: string[] };
        if (prefs.music_genres?.length) favoriteGenres = prefs.music_genres;
        if (prefs.movie_genres?.length) movieGenres = prefs.movie_genres;
      }
    } catch {
      // Not authenticated or Spotify unavailable — proceed without user context
    }

    const systemPrompt = buildSystemPrompt({
      type: parsed.type,
      mood: parsed.mood,
      topArtists,
      topTracks,
      favoriteGenres,
      movieGenres,
    });

    // Persist the current mood as the user's most recent mood (fire-and-forget)
    if (userId) {
      void (async () => {
        try {
          const admin = createAdminClient();
          const { data } = await admin.from("users").select("preferences").eq("id", userId!).single();
          const current = (data?.preferences as Record<string, unknown>) ?? {};
          await admin.from("users").update({ preferences: { ...current, mood: parsed.mood } }).eq("id", userId!);
        } catch {}
      })();
    }

    const client = getGeminiClient();
    const result = await client.models.generateContent({
      model: AI_MODEL,
      contents: [{ role: "user", parts: [{ text: parsed.mood }] }],
      config: {
        systemInstruction: systemPrompt,
        maxOutputTokens: 8192,
        temperature: 0.3,  // low = precise query matching, not creative wandering
        topP: 0.8,
        responseMimeType: "application/json",
      },
    });

    const text = result.text ?? "";

    // Parse and enrich movie results with verified TMDB data (correct poster, synopsis, rating)
    if (parsed.type === "movie") {
      try {
        const rawParsed = JSON.parse(text.replace(/```(?:json)?\n?/g, "").trim());
        const validated = MovieRecommendationSchema.parse(rawParsed);

        // Enrich each movie in parallel — TMDB search by title+year for accurate data
        const enriched = await Promise.allSettled(
          validated.items.map(async (item) => {
            const tmdbData = await searchMovieTMDB(item.title, item.year);
            if (!tmdbData) return item;
            return {
              ...item,
              tmdbId: tmdbData.tmdbId,
              posterPath: tmdbData.posterPath ?? item.posterPath,
              genres: tmdbData.genres.length > 0 ? tmdbData.genres : item.genres,
              rating: tmdbData.rating ?? item.rating,
              synopsis: tmdbData.synopsis ?? undefined,
            };
          })
        );

        const items = enriched
          .map((r) => (r.status === "fulfilled" ? r.value : null))
          .filter(Boolean);

        return Response.json({ type: "movie", items });
      } catch {
        // Enrichment failed — fall back to raw text for client-side parsing
        return Response.json({ text });
      }
    }

    // Music — no enrichment needed, return raw text for client-side parsing
    if (parsed.type === "music") {
      try {
        const rawParsed = JSON.parse(text.replace(/```(?:json)?\n?/g, "").trim());
        const validated = MusicRecommendationSchema.parse(rawParsed);
        return Response.json({ type: "music", items: validated.items });
      } catch {
        return Response.json({ text });
      }
    }

    return Response.json({ text });
  } catch (err) {
    console.error("Recommend API error:", err);
    return Response.json({ error: "Failed to get recommendations" }, { status: 500 });
  }
}
