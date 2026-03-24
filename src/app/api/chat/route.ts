import { NextRequest } from "next/server";
import { getGeminiClient, AI_MODEL } from "@/lib/gemini";
import { buildChatSystemPrompt } from "@/lib/gemini/prompt";
import { z } from "zod/v4";

const MessageSchema = z.object({
  role: z.enum(["user", "assistant"]),
  content: z.string(),
});

const RequestSchema = z.object({
  message: z.string().min(1).max(2000),
  history: z.array(MessageSchema).optional().default([]),
  context: z
    .object({
      topArtists: z.array(z.string()).optional(),
      topTracks: z.array(z.string()).optional(),
      musicGenres: z.array(z.string()).optional(),
      movieGenres: z.array(z.string()).optional(),
    })
    .optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = RequestSchema.parse(body);

    const systemPrompt = buildChatSystemPrompt(parsed.context);

    const contents = [
      ...parsed.history.map((msg) => ({
        role: msg.role === "assistant" ? ("model" as const) : ("user" as const),
        parts: [{ text: msg.content }],
      })),
      { role: "user" as const, parts: [{ text: parsed.message }] },
    ];

    const client = getGeminiClient();

    const encoder = new TextEncoder();
    const readable = new ReadableStream({
      async start(controller) {
        try {
          const stream = await client.models.generateContentStream({
            model: AI_MODEL,
            contents,
            config: {
              systemInstruction: systemPrompt,
              maxOutputTokens: 2000,
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
          console.error("Gemini chat stream error:", err);
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
    console.error("Chat API error:", err);
    return Response.json({ error: "Invalid request" }, { status: 400 });
  }
}
