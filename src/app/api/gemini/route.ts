import { NextRequest } from "next/server";
import { getGeminiClient, AI_MODEL } from "@/lib/gemini";
import { buildSystemPrompt } from "@/lib/gemini/prompt";
import { z } from "zod/v4";

const RequestSchema = z.object({
  type: z.enum(["music", "movie"]),
  mood: z.string().min(1).max(500),
  topArtists: z.array(z.string()).optional(),
  topTracks: z.array(z.string()).optional(),
  favoriteGenres: z.array(z.string()).optional(),
  movieGenres: z.array(z.string()).optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = RequestSchema.parse(body);

    const systemPrompt = buildSystemPrompt({
      type: parsed.type,
      mood: parsed.mood,
      topArtists: parsed.topArtists,
      topTracks: parsed.topTracks,
      favoriteGenres: parsed.favoriteGenres,
      movieGenres: parsed.movieGenres,
    });

    const client = getGeminiClient();

    // Stream the response as text/event-stream
    const encoder = new TextEncoder();
    const readable = new ReadableStream({
      async start(controller) {
        try {
          const stream = await client.models.generateContentStream({
            model: AI_MODEL,
            contents: [{ role: "user", parts: [{ text: parsed.mood }] }],
            config: {
              systemInstruction: systemPrompt,
              maxOutputTokens: 1500,
              temperature: 0.8,
            },
          });
          for await (const chunk of stream) {
            const text = chunk.text ?? "";
            if (text) {
              controller.enqueue(
                encoder.encode(`data: ${JSON.stringify({ text })}\n\n`)
              );
            }
          }
          controller.enqueue(encoder.encode("data: [DONE]\n\n"));
          controller.close();
        } catch (err) {
          console.error("Gemini stream error:", err);
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({ error: "Stream failed" })}\n\n`
            )
          );
          controller.close();
        }
      },
    });

    return new Response(readable, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (err) {
    console.error("API error:", err);
    return Response.json(
      { error: "Invalid request" },
      { status: 400 }
    );
  }
}
