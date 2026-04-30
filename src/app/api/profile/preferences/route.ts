import { NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { z } from "zod/v4";

const UpdateSchema = z.object({
  music_genres: z.array(z.string()).optional(),
  movie_genres: z.array(z.string()).optional(),
  mood: z.string().max(500).optional(),
  default_landing: z.enum(["music", "movies"]).optional(),
});

/** PATCH /api/profile/preferences — update user genre preferences */
export async function PATCH(request: NextRequest) {
  const userId = request.cookies.get("recme_user_id")?.value;
  if (!userId) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const parsed = UpdateSchema.parse(body);

  const admin = createAdminClient();

  // Get current preferences
  const { data: user } = await admin
    .from("users")
    .select("preferences")
    .eq("id", userId)
    .single();

  const currentPrefs = (user?.preferences as Record<string, unknown>) || {};
  const newPrefs = {
    ...currentPrefs,
    ...(parsed.music_genres !== undefined && { music_genres: parsed.music_genres }),
    ...(parsed.movie_genres !== undefined && { movie_genres: parsed.movie_genres }),
    ...(parsed.mood !== undefined && { mood: parsed.mood }),
    ...(parsed.default_landing !== undefined && { default_landing: parsed.default_landing }),
  };

  const { error } = await admin
    .from("users")
    .update({ preferences: newPrefs })
    .eq("id", userId);

  if (error) {
    console.error("Failed to update preferences:", error);
    return Response.json({ error: "Failed to update" }, { status: 500 });
  }

  return Response.json({ preferences: newPrefs });
}
