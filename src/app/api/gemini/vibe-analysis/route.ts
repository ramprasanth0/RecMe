import { NextResponse } from "next/server";
import { getGeminiClient, AI_MODEL } from "@/lib/gemini";

export async function POST(request: Request) {
  try {
    const { track, artist } = await request.json();

    const client = getGeminiClient();

    const prompt = `Analyze the musical vibe of the track "${track}" by "${artist}". 
    Provide estimated values (0.0 to 1.0) for musical features.
    Return only JSON in this exact format:
    {
      "danceability": 0.0,
      "energy": 0.0,
      "valence": 0.0,
      "acousticness": 0.0,
      "instrumentalness": 0.0,
      "tempo": 120,
      "key": "C",
      "mode": "Major"
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
    
    return NextResponse.json(data);
  } catch (err) {
    console.error("Vibe analysis failed:", err);
    return NextResponse.json({ error: "Failed to analyze" }, { status: 500 });
  }
}
