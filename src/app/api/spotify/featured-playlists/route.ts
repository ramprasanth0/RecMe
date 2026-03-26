import { NextResponse } from "next/server";
import { getUserWithFreshToken } from "@/lib/auth/session";
import { getFeaturedPlaylists } from "@/lib/spotify";

export async function GET() {
  try {
    const user = await getUserWithFreshToken();
    if (!user?.spotify_access_token) {
      return NextResponse.json({ playlists: [] });
    }
    const playlists = await getFeaturedPlaylists(user.spotify_access_token, 10);
    return NextResponse.json({ playlists }, {
      headers: { "Cache-Control": "public, max-age=3600" },
    });
  } catch {
    return NextResponse.json({ playlists: [] });
  }
}
