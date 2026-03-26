import { NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { z } from "zod/v4";

const UpdateMessagesSchema = z.object({
  messages: z.array(
    z.object({
      role: z.enum(["user", "assistant"]),
      content: z.string(),
      timestamp: z.string(),
    })
  ),
});

/** PATCH /api/chat/sessions/[id] — update session messages */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const userId = request.cookies.get("recme_user_id")?.value;
  if (!userId) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const parsed = UpdateMessagesSchema.parse(body);

  const admin = createAdminClient();

  // Verify the session belongs to this user
  const { data: session } = await admin
    .from("chat_sessions")
    .select("id")
    .eq("id", params.id)
    .eq("user_id", userId)
    .single();

  if (!session) {
    return Response.json({ error: "Session not found" }, { status: 404 });
  }

  const { error } = await admin
    .from("chat_sessions")
    .update({ messages: parsed.messages })
    .eq("id", params.id)
    .eq("user_id", userId);

  if (error) {
    console.error("Failed to update session:", error);
    return Response.json({ error: "Failed to update session" }, { status: 500 });
  }

  return Response.json({ success: true });
}

/** DELETE /api/chat/sessions/[id] — delete a session */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const userId = request.cookies.get("recme_user_id")?.value;
  if (!userId) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = createAdminClient();
  const { error } = await admin
    .from("chat_sessions")
    .delete()
    .eq("id", params.id)
    .eq("user_id", userId);

  if (error) {
    console.error("Failed to delete session:", error);
    return Response.json({ error: "Failed to delete session" }, { status: 500 });
  }

  return Response.json({ success: true });
}
