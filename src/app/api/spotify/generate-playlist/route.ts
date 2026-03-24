export const maxDuration = 60; // playlist generation needs multiple API calls

import { NextRequest } from "next/server";
import { getUserWithFreshToken } from "@/lib/auth/session";
import { createPlaylist, addTracksToPlaylist, searchTrack, getTopArtists, getTopTracks } from "@/lib/spotify";
import { getGeminiClient, AI_MODEL } from "@/lib/gemini";
import { z } from "zod/v4";

const RequestSchema = z.object({
  prompt: z.string().min(1).max(500),
  trackCount: z.number().min(5).max(20).optional().default(10),
});

export async function POST(request: NextRequest) {
  console.log("[generate-playlist] Request received");

  const user = await getUserWithFreshToken();
  if (!user?.spotify_access_token || !user.spotify_id) {
    console.log("[generate-playlist] Auth failed — no spotify token or id");
    return Response.json({ error: "Spotify not connected" }, { status: 401 });
  }
  console.log("[generate-playlist] User authenticated, spotify_id:", user.spotify_id);

  let body: unknown;
  try {
    body = await request.json();
  } catch (e) {
    console.error("[generate-playlist] Failed to parse request body:", e);
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  let parsed: { prompt: string; trackCount: number };
  try {
    parsed = RequestSchema.parse(body);
  } catch (e) {
    console.error("[generate-playlist] Zod validation failed:", e);
    return Response.json({ error: "Invalid request params" }, { status: 400 });
  }
  console.log("[generate-playlist] Parsed request — prompt:", parsed.prompt, "| trackCount:", parsed.trackCount);

  // Fetch user's Spotify context
  let topArtists: string[] = [];
  let topTracks: string[] = [];
  try {
    const [artists, tracks] = await Promise.all([
      getTopArtists(user.spotify_access_token, 10),
      getTopTracks(user.spotify_access_token, 10),
    ]);
    topArtists = artists.map((a: { name: string }) => a.name);
    topTracks = tracks.map(
      (t: { name: string; artists: { name: string }[] }) =>
        `${t.name} by ${t.artists[0]?.name}`
    );
    console.log("[generate-playlist] Spotify context — artists:", topArtists.length, "| tracks:", topTracks.length);
  } catch (e) {
    console.warn("[generate-playlist] Could not fetch Spotify context (proceeding without):", e);
  }

  const userContext = [
    topArtists.length ? `User's top artists: ${topArtists.join(", ")}` : "",
    topTracks.length ? `User's top tracks: ${topTracks.join(", ")}` : "",
  ]
    .filter(Boolean)
    .join("\n");

  const aiPrompt = `You are a playlist curator. Create a Spotify playlist based on this request: "${parsed.prompt}"

${userContext}

Return exactly ${parsed.trackCount} songs as a JSON object:
{
  "playlistName": "A creative, fitting playlist name",
  "tracks": [
    { "title": "Song Title", "artist": "Artist Name" }
  ]
}

Rules:
- Pick real songs that exist on Spotify
- Match the mood, genre, and energy of the request
- Use the user's taste as a guide but explore beyond their known artists
- Mix well-known and lesser-known tracks for variety
- Return ONLY the JSON object, no markdown fences, no extra text`;

  // Generate playlist with Gemini
  let rawText = "";
  try {
    console.log("[generate-playlist] Calling Gemini...");
    const client = getGeminiClient();
    const result = await client.models.generateContent({
      model: AI_MODEL,
      contents: [{ role: "user", parts: [{ text: aiPrompt }] }],
      config: {
        maxOutputTokens: 8192,
        temperature: 0.8,
        responseMimeType: "application/json",
        thinkingConfig: { thinkingBudget: 0 }, // disable thinking — not needed for playlist curation
      },
    });
    rawText = result.text ?? "";
    console.log("[generate-playlist] Gemini responded, raw length:", rawText.length, "| preview:", rawText.slice(0, 120));
  } catch (e) {
    console.error("[generate-playlist] Gemini call failed:", e);
    return Response.json({ error: "AI generation failed" }, { status: 500 });
  }

  // Parse AI response — strip markdown fences Gemini sometimes adds
  let playlistName = "My RecMe Playlist";
  let tracks: { title: string; artist: string }[] = [];
  try {
    const cleaned = rawText.replace(/```(?:json)?\n?/g, "").trim();
    const start = cleaned.indexOf("{");
    const end = cleaned.lastIndexOf("}");
    if (start === -1 || end === -1) throw new Error("No JSON object found in response");
    const data = JSON.parse(cleaned.slice(start, end + 1));
    playlistName = data.playlistName || playlistName;
    tracks = data.tracks || [];
    console.log("[generate-playlist] Parsed AI response — name:", playlistName, "| tracks:", tracks.length);
  } catch (e) {
    console.error("[generate-playlist] Parse failed:", e, "| rawText:", rawText.slice(0, 300));
    return Response.json({ error: "Failed to parse AI response" }, { status: 500 });
  }

  // Verify token has playlist scope before trying to create
  try {
    const meRes = await fetch("https://api.spotify.com/v1/me", {
      headers: { Authorization: `Bearer ${user.spotify_access_token}` },
    });
    const meData = await meRes.json();
    console.log("[generate-playlist] Token check — Spotify user id:", meData.id, "| product:", meData.product);
  } catch (e) {
    console.warn("[generate-playlist] Token check failed:", e);
  }

  // Create Spotify playlist
  let playlist: { id: string; external_urls: { spotify: string } };
  try {
    console.log("[generate-playlist] Creating Spotify playlist:", playlistName);
    playlist = await createPlaylist(
      user.spotify_access_token,
      user.spotify_id,
      playlistName,
      `Created by RecMe AI — "${parsed.prompt}"`
    );
    console.log("[generate-playlist] Playlist created, id:", playlist.id);
  } catch (e) {
    console.error("[generate-playlist] createPlaylist failed:", e);
    return Response.json({ error: "Failed to create Spotify playlist" }, { status: 500 });
  }

  // Search for tracks in batches of 5 to avoid Spotify rate limits
  const uris: string[] = [];
  const batchSize = 5;
  for (let i = 0; i < tracks.length; i += batchSize) {
    const batch = tracks.slice(i, i + batchSize);
    console.log(`[generate-playlist] Searching batch ${i / batchSize + 1} (${batch.length} tracks)...`);
    const results = await Promise.all(
      batch.map((t) => searchTrack(user.spotify_access_token!, t.title, t.artist))
    );
    const found = results.filter((uri): uri is string => uri !== null);
    console.log(`[generate-playlist] Batch result: ${found.length}/${batch.length} found`);
    uris.push(...found);
  }

  console.log("[generate-playlist] Total URIs found:", uris.length, "of", tracks.length);

  if (uris.length > 0) {
    try {
      await addTracksToPlaylist(user.spotify_access_token, playlist.id, uris);
      console.log("[generate-playlist] Tracks added to playlist successfully");
    } catch (e) {
      console.error("[generate-playlist] addTracksToPlaylist failed:", e);
      return Response.json({ error: "Failed to add tracks to playlist" }, { status: 500 });
    }
  }

  console.log("[generate-playlist] Done —", uris.length, "tracks added to", playlistName);
  return Response.json({
    playlistName,
    playlistUrl: playlist.external_urls.spotify,
    tracksAdded: uris.length,
    tracksTotal: tracks.length,
    tracks,
  });
}
