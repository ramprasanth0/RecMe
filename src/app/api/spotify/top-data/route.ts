import { NextResponse } from "next/server";
import { getUserWithFreshToken } from "@/lib/auth/session";
import { getTopArtists, getTopTracks } from "@/lib/spotify";

/** GET /api/spotify/top-data — returns top artists + top tracks in one request.
 *  Replaces separate /top-artists and /top-tracks calls to avoid two concurrent
 *  token refreshes for the same user session. */
export async function GET() {
  const user = await getUserWithFreshToken();

  if (!user?.spotify_access_token) {
    return NextResponse.json(
      { error: "Not authenticated with Spotify" },
      { status: 401 }
    );
  }

  try {
    const [artists, tracks] = await Promise.all([
      getTopArtists(user.spotify_access_token),
      getTopTracks(user.spotify_access_token),
    ]);
    return NextResponse.json({ artists, tracks });
  } catch (err) {
    console.error("Failed to fetch Spotify top data:", err);
    return NextResponse.json(
      { error: "Failed to fetch Spotify data" },
      { status: 500 }
    );
  }
}
