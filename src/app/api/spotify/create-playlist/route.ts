import { NextRequest } from "next/server";
import { getUserWithFreshToken } from "@/lib/auth/session";
import { createPlaylist, searchTrack, addTracksToPlaylist } from "@/lib/spotify";
import { z } from "zod/v4";

const RequestSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(300).optional().default(""),
  tracks: z.array(
    z.object({
      title: z.string(),
      artist: z.string(),
      spotifyUri: z.string().optional(),
    })
  ),
});

export async function POST(request: NextRequest) {
  const user = await getUserWithFreshToken();
  if (!user?.spotify_access_token || !user.spotify_id) {
    return Response.json({ error: "Spotify not connected" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const parsed = RequestSchema.parse(body);

    // Create the playlist
    const playlist = await createPlaylist(
      user.spotify_access_token,
      user.spotify_id,
      parsed.name,
      parsed.description
    );

    // Resolve track URIs — use provided URI or search
    const uris: string[] = [];
    for (const track of parsed.tracks) {
      if (track.spotifyUri) {
        uris.push(track.spotifyUri);
      } else {
        const uri = await searchTrack(
          user.spotify_access_token,
          track.title,
          track.artist
        );
        if (uri) uris.push(uri);
      }
    }

    // Add tracks to playlist
    if (uris.length > 0) {
      await addTracksToPlaylist(user.spotify_access_token, playlist.id, uris);
    }

    return Response.json({
      playlistId: playlist.id,
      playlistUrl: playlist.external_urls.spotify,
      tracksAdded: uris.length,
      tracksTotal: parsed.tracks.length,
    });
  } catch (err) {
    console.error("Create playlist error:", err);
    return Response.json(
      { error: err instanceof Error ? err.message : "Failed to create playlist" },
      { status: 500 }
    );
  }
}
