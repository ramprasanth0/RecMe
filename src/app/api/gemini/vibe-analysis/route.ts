import { NextResponse } from "next/server";
import { getGeminiClient, AI_MODEL } from "@/lib/gemini";

export async function POST(request: Request) {
  try {
    const { track, artist } = await request.json();

    const genAI = getGeminiClient();
    const model = genAI.getGenerativeModel({ model: AI_MODEL });

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

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    const jsonStr = text.replace(/```json|```/g, "").trim();
    const data = JSON.parse(jsonStr);
    
    return NextResponse.json(data);
  } catch (err) {
    console.error("Vibe analysis failed:", err);
    return NextResponse.json({ error: "Failed to analyze" }, { status: 500 });
  }
}
