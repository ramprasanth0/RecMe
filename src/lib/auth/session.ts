import { cookies } from "next/headers";
import { createAdminClient } from "@/lib/supabase/admin";
import { refreshAccessToken } from "@/lib/spotify/auth";
import type { DBUser } from "@/types/db";

/** Get the current authenticated user from the session cookie, or null */
export async function getCurrentUser(): Promise<DBUser | null> {
  const userId = cookies().get("recme_user_id")?.value;
  if (!userId) return null;

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("users")
    .select("*")
    .eq("id", userId)
    .single();

  if (error || !data) return null;
  return data as DBUser;
}

/** Get user with a fresh Spotify access token (refreshes if needed) */
export async function getUserWithFreshToken(): Promise<DBUser | null> {
  const user = await getCurrentUser();
  if (!user || !user.spotify_refresh_token) return user;

  // Try refreshing the token proactively
  try {
    const tokens = await refreshAccessToken(user.spotify_refresh_token);
    const admin = createAdminClient();

    await admin
      .from("users")
      .update({
        spotify_access_token: tokens.access_token,
        ...(tokens.refresh_token && {
          spotify_refresh_token: tokens.refresh_token,
        }),
      })
      .eq("id", user.id);

    return {
      ...user,
      spotify_access_token: tokens.access_token,
      ...(tokens.refresh_token && {
        spotify_refresh_token: tokens.refresh_token,
      }),
    };
  } catch (err) {
    // If refresh fails, return user with existing token — caller handles errors
    console.warn("Spotify token refresh failed (stale tokens?):", err instanceof Error ? err.message : err);
    return user;
  }
}
