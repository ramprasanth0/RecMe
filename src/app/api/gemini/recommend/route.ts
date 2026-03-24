export const maxDuration = 30; // extend Vercel timeout to 30s

import { NextRequest } from "next/server";
import { getGeminiClient, AI_MODEL } from "@/lib/gemini";
import { buildSystemPrompt } from "@/lib/gemini/prompt";
import { z } from "zod/v4";
import { getCurrentUser } from "@/lib/auth/session";
import { getTopArtists, getTopTracks } from "@/lib/spotify";

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

    try {
      const user = await getCurrentUser();
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

    const client = getGeminiClient();
    const result = await client.models.generateContent({
      model: AI_MODEL,
      contents: [{ role: "user", parts: [{ text: parsed.mood }] }],
      config: {
        systemInstruction: systemPrompt,
        maxOutputTokens: 8192,
        temperature: 0.8,
        responseMimeType: "application/json",
        thinkingConfig: { thinkingBudget: 0 },
      },
    });

    const text = result.text ?? "";
    return Response.json({ text });
  } catch (err) {
    console.error("Recommend API error:", err);
    return Response.json({ error: "Failed to get recommendations" }, { status: 500 });
  }
}
