import { NextResponse } from "next/server";
import { getUserWithFreshToken } from "@/lib/auth/session";
import { getPlaylistTracks, GLOBAL_TOP_50_ID, INDIA_TOP_50_ID } from "@/lib/spotify";
import { getClientCredentialsToken } from "@/lib/spotify/clientToken";

export async function GET() {
  try {
    // Use user token if available, otherwise fall back to app-only client credentials
    const user = await getUserWithFreshToken().catch(() => null);
    const token = user?.spotify_access_token || await getClientCredentialsToken();

    const [globalSongs, indiaSongs] = await Promise.all([
      getPlaylistTracks(token, GLOBAL_TOP_50_ID, 20),
      getPlaylistTracks(token, INDIA_TOP_50_ID, 20),
    ]);

    return NextResponse.json(
      { global: globalSongs, india: indiaSongs },
      { headers: { "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=1800" } }
    );
  } catch (error) {
    console.error("[trending-songs] Error:", error);
    return NextResponse.json({ global: [], india: [] }, { status: 500 });
  }
}
