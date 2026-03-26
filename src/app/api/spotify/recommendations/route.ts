import { NextResponse } from "next/server";
import { getUserWithFreshToken } from "@/lib/auth/session";
import { getTopTracks, getRecommendations } from "@/lib/spotify";

export async function GET() {
  try {
    const user = await getUserWithFreshToken();
    if (!user?.spotify_access_token) {
      return NextResponse.json({ songs: [] });
    }

    // Seed recommendations from user's top 5 short-term tracks
    const topTracks = await getTopTracks(user.spotify_access_token, 5);
    const seedIds: string[] = (topTracks as Array<{ id: string }>).map((t) => t.id);

    if (seedIds.length === 0) {
      return NextResponse.json({ songs: [] });
    }

    const songs = await getRecommendations(user.spotify_access_token, seedIds, 20);
    return NextResponse.json({ songs });
  } catch {
    return NextResponse.json({ songs: [] });
  }
}
