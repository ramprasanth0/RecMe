import { NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { z } from "zod/v4";

/** GET /api/chat/sessions — list user's chat sessions */
export async function GET(request: NextRequest) {
  const userId = request.cookies.get("recme_user_id")?.value;
  if (!userId) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("chat_sessions")
    .select("id, type, messages, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(20);

  if (error) {
    console.error("Failed to fetch sessions:", error);
    return Response.json({ error: "Failed to fetch sessions" }, { status: 500 });
  }

  return Response.json({ sessions: data });
}

const CreateSessionSchema = z.object({
  type: z.enum(["music", "movie"]).default("music"),
});

/** POST /api/chat/sessions — create a new chat session */
export async function POST(request: NextRequest) {
  const userId = request.cookies.get("recme_user_id")?.value;
  if (!userId) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const parsed = CreateSessionSchema.parse(body);

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("chat_sessions")
    .insert({
      user_id: userId,
      type: parsed.type,
      messages: [],
    })
    .select("id, type, messages, created_at")
    .single();

  if (error) {
    console.error("Failed to create session:", error);
    return Response.json({ error: "Failed to create session" }, { status: 500 });
  }

  return Response.json({ session: data });
}
