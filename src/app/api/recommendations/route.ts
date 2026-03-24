import { NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { z } from "zod/v4";

/** GET /api/recommendations — list user's saved recommendations */
export async function GET(request: NextRequest) {
  const userId = request.cookies.get("recme_user_id")?.value;
  if (!userId) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const type = request.nextUrl.searchParams.get("type"); // "music" | "movie" | null (all)

  const admin = createAdminClient();
  let query = admin
    .from("recommendations")
    .select("*")
    .eq("user_id", userId)
    .order("saved_at", { ascending: false })
    .limit(50);

  if (type === "music" || type === "movie") {
    query = query.eq("type", type);
  }

  const { data, error } = await query;

  if (error) {
    console.error("Failed to fetch recommendations:", error);
    return Response.json({ error: "Failed to fetch" }, { status: 500 });
  }

  return Response.json({ recommendations: data });
}

const SaveSchema = z.object({
  type: z.enum(["music", "movie"]),
  item_data: z.record(z.string(), z.unknown()),
});

/** POST /api/recommendations — save a recommendation */
export async function POST(request: NextRequest) {
  const userId = request.cookies.get("recme_user_id")?.value;
  if (!userId) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const parsed = SaveSchema.parse(body);

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("recommendations")
    .insert({
      user_id: userId,
      type: parsed.type,
      item_data: parsed.item_data,
    })
    .select("id, type, item_data, saved_at")
    .single();

  if (error) {
    console.error("Failed to save recommendation:", error);
    return Response.json({ error: "Failed to save" }, { status: 500 });
  }

  return Response.json({ recommendation: data });
}
