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

/** Get user with a fresh Spotify access token — only refreshes when token is expired or close to expiry */
export async function getUserWithFreshToken(): Promise<DBUser | null> {
  const user = await getCurrentUser();
  if (!user || !user.spotify_refresh_token) return user;

  // null expiry → treat as expired so we refresh and store the timestamp going forward
  const expiresAt = user.spotify_token_expires_at
    ? new Date(user.spotify_token_expires_at).getTime()
    : 0;

  // Token is still valid with >60s to spare — skip the refresh entirely
  if (Date.now() < expiresAt - 60_000) return user;

  try {
    const tokens = await refreshAccessToken(user.spotify_refresh_token);
    const tokenExpiresAt = new Date(Date.now() + tokens.expires_in * 1000).toISOString();
    const admin = createAdminClient();

    await admin
      .from("users")
      .update({
        spotify_access_token: tokens.access_token,
        spotify_token_expires_at: tokenExpiresAt,
        ...(tokens.refresh_token && {
          spotify_refresh_token: tokens.refresh_token,
        }),
      })
      .eq("id", user.id);

    return {
      ...user,
      spotify_access_token: tokens.access_token,
      spotify_token_expires_at: tokenExpiresAt,
      ...(tokens.refresh_token && {
        spotify_refresh_token: tokens.refresh_token,
      }),
    };
  } catch (err) {
    console.warn("Spotify token refresh failed (stale tokens?):", err instanceof Error ? err.message : err);
    return user;
  }
}
