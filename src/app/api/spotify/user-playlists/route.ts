import { NextResponse } from "next/server";
import { getUserWithFreshToken } from "@/lib/auth/session";
import { getUserPlaylists } from "@/lib/spotify";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const user = await getUserWithFreshToken();
    if (!user?.spotify_access_token) {
      console.error("[user-playlists] User has no Spotify access token.", { userId: user?.id });
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }
    const playlists = await getUserPlaylists(user.spotify_access_token, 20);
    return NextResponse.json({ playlists });
  } catch (error) {
    console.error("[user-playlists] Unknown error:", error);
    return NextResponse.json({ playlists: [] });
  }
}
