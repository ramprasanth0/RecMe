import { NextRequest, NextResponse } from "next/server";
import { getGeminiClient, AI_MODEL } from "@/lib/gemini";

export async function POST(request: NextRequest) {
  try {
    const { track_name, artist, genius_description, release_date } = await request.json();

    if (!track_name || !artist) {
      return NextResponse.json({ error: "track_name and artist are required" }, { status: 400 });
    }

    const ai = getGeminiClient();

    const descriptionSnippet = genius_description
      ? genius_description.replace(/<[^>]+>/g, "").slice(0, 600)
      : "";

    const prompt = `Analyze the song "${track_name}" by ${artist}${release_date ? ` (released ${release_date})` : ""}.${
      descriptionSnippet ? `\n\nContext: ${descriptionSnippet}` : ""
    }

Return a JSON object with exactly these fields:
- "mood": a 2-4 word evocative mood label (e.g. "Melancholic Euphoria", "Rebellious Late-Night Energy")
- "tags": array of exactly 4 short descriptive strings covering genre, emotion, theme, and production style
- "analysis": 2-3 sentences analyzing the song's themes, production, and cultural context. Be specific and insightful, not generic.

Respond with only valid JSON, no markdown fences.`;

    const response = await ai.models.generateContent({
      model: AI_MODEL,
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      config: { maxOutputTokens: 350 },
    });

    const text = response.text ?? "";
    const cleaned = text.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "").trim();
    const parsed = JSON.parse(cleaned);

    return NextResponse.json(parsed);
  } catch (err) {
    console.error("Track analysis failed:", err);
    return NextResponse.json({ error: "Analysis failed" }, { status: 500 });
  }
}
