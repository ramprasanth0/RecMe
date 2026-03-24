import { NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

/** DELETE /api/recommendations/[id] — unsave a recommendation */
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
    .from("recommendations")
    .delete()
    .eq("id", params.id)
    .eq("user_id", userId);

  if (error) {
    console.error("Failed to delete recommendation:", error);
    return Response.json({ error: "Failed to delete" }, { status: 500 });
  }

  return Response.json({ success: true });
}
