import { NextResponse } from "next/server";
import { getUserWithFreshToken } from "@/lib/auth/session";
import { getGlobalTop50 } from "@/lib/spotify";

export async function GET() {
  try {
    const user = await getUserWithFreshToken();
    if (!user?.spotify_access_token) {
      return NextResponse.json({ songs: [] });
    }
    const songs = await getGlobalTop50(user.spotify_access_token, 20);
    return NextResponse.json({ songs }, {
      headers: { "Cache-Control": "public, max-age=3600" },
    });
  } catch {
    return NextResponse.json({ songs: [] });
  }
}
