import { NextResponse } from "next/server";
import { getUserWithFreshToken } from "@/lib/auth/session";
import { getTopTracks } from "@/lib/spotify";

export async function GET() {
  const user = await getUserWithFreshToken();

  if (!user?.spotify_access_token) {
    return NextResponse.json(
      { error: "Not authenticated with Spotify" },
      { status: 401 }
    );
  }

  try {
    const tracks = await getTopTracks(user.spotify_access_token);
    return NextResponse.json({ tracks });
  } catch (err) {
    console.error("Failed to fetch top tracks:", err);
    return NextResponse.json(
      { error: "Failed to fetch Spotify data" },
      { status: 500 }
    );
  }
}
