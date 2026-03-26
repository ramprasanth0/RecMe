import { NextResponse } from "next/server";
import { getUserWithFreshToken } from "@/lib/auth/session";
import { getPlaylistTracks, GLOBAL_TOP_50_ID, INDIA_TOP_50_ID } from "@/lib/spotify";
import type { TrendingSong } from "@/types/trending";

export async function GET() {
  try {
    const user = await getUserWithFreshToken();
    if (!user?.spotify_access_token) {
      return NextResponse.json({ songs: [] });
    }

    // Fetch Global Top 50 + India Top 50 in parallel
    const [global, india] = await Promise.all([
      getPlaylistTracks(user.spotify_access_token, GLOBAL_TOP_50_ID, 20),
      getPlaylistTracks(user.spotify_access_token, INDIA_TOP_50_ID, 20),
    ]);

    // Merge and deduplicate by track ID
    const seen = new Set<string>();
    const songs: TrendingSong[] = [];
    for (const track of [...global, ...india]) {
      if (!seen.has(track.id)) {
        seen.add(track.id);
        songs.push(track);
        if (songs.length >= 30) break;
      }
    }

    return NextResponse.json({ songs }, {
      headers: { "Cache-Control": "public, max-age=3600" },
    });
  } catch {
    return NextResponse.json({ songs: [] });
  }
}
