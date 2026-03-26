import { NextResponse } from "next/server";
import { getUserWithFreshToken } from "@/lib/auth/session";
import { getUserPlaylists } from "@/lib/spotify";

export async function GET() {
  try {
    const user = await getUserWithFreshToken();
    if (!user?.spotify_access_token) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }
    const playlists = await getUserPlaylists(user.spotify_access_token, 20);
    return NextResponse.json({ playlists });
  } catch {
    return NextResponse.json({ playlists: [] });
  }
}
