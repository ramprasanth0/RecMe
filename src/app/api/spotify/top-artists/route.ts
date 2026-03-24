import { NextResponse } from "next/server";
import { getUserWithFreshToken } from "@/lib/auth/session";
import { getTopArtists } from "@/lib/spotify";

export async function GET() {
  const user = await getUserWithFreshToken();

  if (!user?.spotify_access_token) {
    return NextResponse.json(
      { error: "Not authenticated with Spotify" },
      { status: 401 }
    );
  }

  try {
    const artists = await getTopArtists(user.spotify_access_token);
    return NextResponse.json({ artists });
  } catch (err) {
    console.error("Failed to fetch top artists:", err);
    return NextResponse.json(
      { error: "Failed to fetch Spotify data" },
      { status: 500 }
    );
  }
}
