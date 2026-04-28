import { NextResponse } from "next/server";
import { getUserWithFreshToken } from "@/lib/auth/session";
import { getAudioFeatures } from "@/lib/spotify";

export async function GET(request: Request) {
  const user = await getUserWithFreshToken();
  const { searchParams } = new URL(request.url);
  const ids = searchParams.get("ids");

  if (!user?.spotify_access_token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!ids) {
    return NextResponse.json({ error: "Missing ids" }, { status: 400 });
  }

  try {
    const features = await getAudioFeatures(user.spotify_access_token, ids.split(","));
    return NextResponse.json(features);
  } catch (err) {
    console.error("Failed to fetch audio features:", err);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
