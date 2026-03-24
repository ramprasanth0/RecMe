import { NextRequest } from "next/server";
import { getGeminiClient, AI_MODEL } from "@/lib/gemini";
import { buildSystemPrompt } from "@/lib/gemini/prompt";
import { z } from "zod/v4";
import { getCurrentUser } from "@/lib/auth/session";
import { getTopArtists, getTopTracks } from "@/lib/spotify";

const RequestSchema = z.object({
  type: z.enum(["music", "movie"]),
  mood: z.string().min(1).max(500),
  topArtists: z.array(z.string()).optional(),
  topTracks: z.array(z.string()).optional(),
  favoriteGenres: z.array(z.string()).optional(),
  movieGenres: z.array(z.string()).optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = RequestSchema.parse(body);

    // Auto-inject Spotify data + preferences if user is authenticated
    let topArtists = parsed.topArtists;
    let topTracks = parsed.topTracks;
    let favoriteGenres = parsed.favoriteGenres;
    let movieGenres = parsed.movieGenres;

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
        if (!favoriteGenres?.length && prefs.music_genres?.length) favoriteGenres = prefs.music_genres;
        if (!movieGenres?.length && prefs.movie_genres?.length) movieGenres = prefs.movie_genres;
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

    // Stream the response as text/event-stream
    const encoder = new TextEncoder();
    const readable = new ReadableStream({
      async start(controller) {
        try {
          const stream = await client.models.generateContentStream({
            model: AI_MODEL,
            contents: [{ role: "user", parts: [{ text: parsed.mood }] }],
            config: {
              systemInstruction: systemPrompt,
              maxOutputTokens: 2000,
              temperature: 0.8,
            },
          });
          for await (const chunk of stream) {
            const text = chunk.text ?? "";
            if (text) {
              controller.enqueue(
                encoder.encode(`data: ${JSON.stringify({ text })}\n\n`)
              );
            }
          }
          controller.enqueue(encoder.encode("data: [DONE]\n\n"));
          controller.close();
        } catch (err) {
          console.error("Gemini stream error:", err);
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({ error: "Stream failed" })}\n\n`
            )
          );
          controller.close();
        }
      },
    });

    return new Response(readable, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (err) {
    console.error("API error:", err);
    return Response.json(
      { error: "Invalid request" },
      { status: 400 }
    );
  }
}
