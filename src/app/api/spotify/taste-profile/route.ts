import { NextResponse } from "next/server";
import { getUserWithFreshToken } from "@/lib/auth/session";
import { getTopTracks, getRecentlyPlayed } from "@/lib/spotify";
import { getGeminiClient, AI_MODEL } from "@/lib/gemini";

/* eslint-disable @typescript-eslint/no-explicit-any */
export async function GET() {
  const user = await getUserWithFreshToken();

  if (!user?.spotify_access_token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    let topTracks = await getTopTracks(user.spotify_access_token, 50, "medium_term");
    if (!topTracks || topTracks.length === 0) {
      topTracks = await getTopTracks(user.spotify_access_token, 50, "long_term");
    }
    if (!topTracks || topTracks.length === 0) {
      topTracks = await getRecentlyPlayed(user.spotify_access_token, 50);
    }
    
    if (!topTracks || topTracks.length === 0) {
      return NextResponse.json({ profile: null });
    }

    // Use Gemini to analyze the taste since Spotify's /audio-features is restricted
    const trackNames = topTracks.map((t: any) => `${t.name} by ${t.artists[0]?.name}`).join(", ");
    
    const genAI = getGeminiClient();
    const model = genAI.getGenerativeModel({ model: AI_MODEL });

    const prompt = `Analyze the musical taste of a user based on these top tracks: ${trackNames}.
    Provide an aggregated preference percentage (0.0 to 1.0) for:
    danceability, energy, valence, acousticness, instrumentalness, and speechiness.
    Return only JSON in this format:
    {
      "danceability": 0.0,
      "energy": 0.0,
      "valence": 0.0,
      "acousticness": 0.0,
      "instrumentalness": 0.0,
      "speechiness": 0.0
    }`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    const jsonStr = text.replace(/```json|```/g, "").trim();
    const data = JSON.parse(jsonStr);

    return NextResponse.json({ profile: data });
  } catch (err) {
    console.error("Failed to fetch taste profile with AI:", err);
    return NextResponse.json({ error: "Failed to fetch taste profile" }, { status: 500 });
  }
}
