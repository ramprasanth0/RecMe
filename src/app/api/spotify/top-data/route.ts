import { NextResponse } from "next/server";
import { getUserWithFreshToken } from "@/lib/auth/session";
import { getTopArtists, getTopTracks, getRecentlyPlayed, getArtists } from "@/lib/spotify";

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

    // Attach full artist objects to recent tracks so images are available
    if (recentTracks.length > 0) {
      /* eslint-disable @typescript-eslint/no-explicit-any */
      const recentArtistIds = Array.from(new Set(recentTracks.flatMap((t: any) => t.artists.map((a: any) => a.id)).filter(Boolean)));
      if (recentArtistIds.length > 0) {
        const fullArtists = await getArtists(user.spotify_access_token, recentArtistIds as string[]);
        const artistMap = new Map(fullArtists.map((a: any) => [a.id, a]));
        recentTracks.forEach((track: any) => {
          track.artists = track.artists.map((a: any) => artistMap.get(a.id) || a);
        });
      }
      /* eslint-enable @typescript-eslint/no-explicit-any */
    }

    return NextResponse.json({ artists, tracks, recentTracks });
  } catch (err) {
    console.error("Failed to fetch Spotify top data:", err);
    return NextResponse.json(
      { error: "Failed to fetch Spotify data" },
      { status: 500 }
    );
  }
}
