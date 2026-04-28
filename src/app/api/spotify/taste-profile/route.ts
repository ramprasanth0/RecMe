import { NextResponse } from "next/server";
import { getUserWithFreshToken } from "@/lib/auth/session";
import { getTopTracks, getRecentlyPlayed } from "@/lib/spotify";
import { getGeminiClient, AI_MODEL } from "@/lib/gemini";
import { createAdminClient } from "@/lib/supabase/admin";

/* eslint-disable @typescript-eslint/no-explicit-any */
export async function GET() {
  const user = await getUserWithFreshToken();

  if (!user?.spotify_access_token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Check cache (1 day)
  const prefs = (user.preferences as any) || {};
  const cachedProfile = prefs.taste_profile;
  const lastUpdated = prefs.taste_profile_updated_at;

  if (cachedProfile && lastUpdated) {
    const age = Date.now() - new Date(lastUpdated).getTime();
    const oneDay = 24 * 60 * 60 * 1000;
    if (age < oneDay) {
      return NextResponse.json({ profile: cachedProfile, cached: true });
    }
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

    const trackNames = topTracks.map((t: any) => `${t.name} by ${t.artists[0]?.name}`).join(", ");
    
    const client = getGeminiClient();

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

    const result = await client.models.generateContent({
      model: AI_MODEL,
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      config: {
        responseMimeType: "application/json",
      }
    });

    const text = result.text ?? "{}";
    const data = JSON.parse(text);

    // Save to cache
    const admin = createAdminClient();
    await admin.from("users").update({
      preferences: {
        ...prefs,
        taste_profile: data,
        taste_profile_updated_at: new Date().toISOString()
      }
    }).eq("id", user.id);

    return NextResponse.json({ profile: data });
  } catch (err) {
    console.error("Failed to fetch taste profile with AI:", err);
    return NextResponse.json({ error: "Failed to fetch taste profile" }, { status: 500 });
  }
}
