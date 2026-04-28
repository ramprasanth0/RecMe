import { NextResponse } from "next/server";
import { getUserWithFreshToken } from "@/lib/auth/session";
import { getTopTracks, getAudioFeatures } from "@/lib/spotify";

/* eslint-disable @typescript-eslint/no-explicit-any */
export async function GET() {
  const user = await getUserWithFreshToken();

  if (!user?.spotify_access_token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const topTracks = await getTopTracks(user.spotify_access_token, 50, "medium_term");
    const trackIds = topTracks.map((t: any) => t.id);
    const features = await getAudioFeatures(user.spotify_access_token, trackIds);

    const validFeatures = features.filter((f: any) => f !== null);
    const count = validFeatures.length;

    if (count === 0) return NextResponse.json({ profile: null });

    const averages = validFeatures.reduce((acc: any, f: any) => ({
      danceability: acc.danceability + f.danceability,
      energy: acc.energy + f.energy,
      valence: acc.valence + f.valence,
      instrumentalness: acc.instrumentalness + f.instrumentalness,
      acousticness: acc.acousticness + f.acousticness,
      speechiness: acc.speechiness + f.speechiness,
    }), {
      danceability: 0,
      energy: 0,
      valence: 0,
      instrumentalness: 0,
      acousticness: 0,
      speechiness: 0,
    });

    const result: Record<string, number> = {};
    Object.keys(averages).forEach(key => {
      result[key] = averages[key as keyof typeof averages] / count;
    });

    return NextResponse.json({ profile: result });
  } catch (err) {
    console.error("Failed to fetch taste profile:", err);
    return NextResponse.json({ error: "Failed to fetch taste profile" }, { status: 500 });
  }
}
