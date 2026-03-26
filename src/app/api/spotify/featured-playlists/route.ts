import { NextResponse } from "next/server";
import { getUserWithFreshToken } from "@/lib/auth/session";
import { getFeaturedPlaylists } from "@/lib/spotify";
import { getClientCredentialsToken } from "@/lib/spotify/clientToken";

export async function GET() {
  try {
    // Use user token if available, otherwise fall back to app-only client credentials
    const user = await getUserWithFreshToken().catch(() => null);
    const token = user?.spotify_access_token || await getClientCredentialsToken();

    const playlists = await getFeaturedPlaylists(token, 10);

    return NextResponse.json(
      { playlists },
      { headers: { "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=1800" } }
    );
  } catch (error) {
    console.error("[featured-playlists] Error:", error);
    return NextResponse.json({ playlists: [] }, { status: 500 });
  }
}
