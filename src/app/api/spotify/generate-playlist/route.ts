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
  const user = await getUserWithFreshToken();
  if (!user?.spotify_access_token || !user.spotify_id) {
    return Response.json({ error: "Spotify not connected" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  let parsed: { prompt: string; trackCount: number };
  try {
    parsed = RequestSchema.parse(body);
  } catch {
    return Response.json({ error: "Invalid request params" }, { status: 400 });
  }

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
  } catch {
    // Proceed without context
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
    const client = getGeminiClient();
    const result = await client.models.generateContent({
      model: AI_MODEL,
      contents: [{ role: "user", parts: [{ text: aiPrompt }] }],
      config: {
        maxOutputTokens: 8192,
        temperature: 0.8,
        responseMimeType: "application/json",
        thinkingConfig: { thinkingBudget: 0 }, // disable thinking — fast, deterministic output
      },
    });
    rawText = result.text ?? "";
  } catch (e) {
    console.error("generate-playlist: Gemini call failed:", e);
    return Response.json({ error: "AI generation failed" }, { status: 500 });
  }

  // Parse AI response
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
  } catch (e) {
    console.error("generate-playlist: parse failed:", e);
    return Response.json({ error: "Failed to parse AI response" }, { status: 500 });
  }

  // Create Spotify playlist
  let playlist: { id: string; external_urls: { spotify: string } };
  try {
    playlist = await createPlaylist(
      user.spotify_access_token,
      user.spotify_id,
      playlistName,
      `Created by RecMe AI — "${parsed.prompt}"`
    );
  } catch (e) {
    console.error("generate-playlist: createPlaylist failed:", e);
    return Response.json({ error: "Failed to create Spotify playlist" }, { status: 500 });
  }

  // Search for tracks in batches of 5 to avoid Spotify rate limits
  const uris: string[] = [];
  const batchSize = 5;
  for (let i = 0; i < tracks.length; i += batchSize) {
    const batch = tracks.slice(i, i + batchSize);
    const results = await Promise.all(
      batch.map((t) => searchTrack(user.spotify_access_token!, t.title, t.artist))
    );
    uris.push(...results.filter((uri): uri is string => uri !== null));
  }

  let tracksAdded = 0;
  let tracksWarning: string | undefined;

  if (uris.length > 0) {
    try {
      await addTracksToPlaylist(user.spotify_access_token, playlist.id, uris);
      tracksAdded = uris.length;
    } catch (e) {
      console.error("generate-playlist: addTracksToPlaylist failed:", e);
      tracksWarning = "Playlist created but tracks could not be added — reconnect Spotify from your profile to grant full permissions.";
    }
  }

  return Response.json({
    playlistName,
    playlistUrl: playlist.external_urls.spotify,
    tracksAdded,
    tracksTotal: tracks.length,
    tracks,
    warning: tracksWarning,
  });
}
