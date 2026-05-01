import { NextRequest, NextResponse } from "next/server";
import { getUserWithFreshToken } from "@/lib/auth/session";

/** GET /api/spotify/similar-songs?track_id=<id>&limit=5 */
export async function GET(request: NextRequest) {
  let trackId = request.nextUrl.searchParams.get("track_id");
  const limit = Math.min(parseInt(request.nextUrl.searchParams.get("limit") ?? "5", 10), 10);

  if (!trackId) {
    return NextResponse.json({ error: "track_id is required" }, { status: 400 });
  }

  // Ensure trackId is just the ID, not a full URI
  if (trackId.includes(":")) {
    trackId = trackId.split(":").pop()!;
  }

  const user = await getUserWithFreshToken();
  if (!user?.spotify_access_token) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  try {
    const res = await fetch(
      `https://api.spotify.com/v1/recommendations?seed_tracks=${encodeURIComponent(trackId)}&limit=${limit}`,
      {
        headers: { Authorization: `Bearer ${user.spotify_access_token}` },
        cache: "no-store",
      }
    );

    if (!res.ok) {
      const errorText = await res.text();
      console.error(`Spotify recommendations API failed: ${res.status} ${errorText}`);
      return NextResponse.json({ songs: [] });
    }

    const data = await res.json();
    const songs = (data.tracks ?? []).map((t: { 
      id: string; 
      name: string; 
      artists: { name: string }[]; 
      album: { images: { url: string }[] }; 
      external_urls: { spotify: string };
      uri: string;
    }) => ({
      id: t.id,
      title: t.name,
      artist: t.artists?.[0]?.name ?? "",
      albumArt: t.album?.images?.[0]?.url ?? null,
      spotifyUrl: t.external_urls?.spotify ?? null,
      uri: t.uri,
    }));

    return NextResponse.json({ songs });
  } catch (err) {
    console.error("Failed to fetch similar songs:", err);
    return NextResponse.json({ songs: [] });
  }
}
