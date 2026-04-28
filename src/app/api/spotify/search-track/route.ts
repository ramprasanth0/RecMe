import { NextRequest, NextResponse } from "next/server";
import { getUserWithFreshToken } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const title = searchParams.get("title");
  const artist = searchParams.get("artist");

  if (!title || !artist) {
    return NextResponse.json(
      { error: "Title and artist are required" },
      { status: 400 }
    );
  }

  try {
    const user = await getUserWithFreshToken();
    if (!user || !user.spotify_access_token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const query = encodeURIComponent(`track:${title} artist:${artist}`);
    const res = await fetch(
      `https://api.spotify.com/v1/search?q=${query}&type=track&limit=1`,
      {
        headers: {
          Authorization: `Bearer ${user.spotify_access_token}`,
        },
      }
    );

    if (!res.ok) {
      throw new Error("Failed to search Spotify");
    }

    const data = await res.json();
    const track = data.tracks?.items?.[0];

    return NextResponse.json({
      uri: track?.uri || null,
    });
  } catch (error) {
    console.error("Spotify search error:", error);
    return NextResponse.json({ uri: null }, { status: 500 });
  }
}
