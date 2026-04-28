import { NextResponse } from "next/server";
import { getUserWithFreshToken } from "@/lib/auth/session";
import { getTopArtists, getTopTracks, getRecentlyPlayed } from "@/lib/spotify";

/** GET /api/spotify/top-data — returns top artists, top tracks, and recently played. */
export async function GET() {
  const user = await getUserWithFreshToken();

  if (!user?.spotify_access_token) {
    return NextResponse.json(
      { error: "Not authenticated with Spotify" },
      { status: 401 }
    );
  }

  try {
    const [artists, tracks, recentTracks] = await Promise.all([
      getTopArtists(user.spotify_access_token),
      getTopTracks(user.spotify_access_token),
      getRecentlyPlayed(user.spotify_access_token).catch(() => []), // fallback for un-granted scopes
    ]);
    return NextResponse.json({ artists, tracks, recentTracks });
  } catch (err) {
    console.error("Failed to fetch Spotify top data:", err);
    return NextResponse.json(
      { error: "Failed to fetch Spotify data" },
      { status: 500 }
    );
  }
}
