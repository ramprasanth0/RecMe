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

  if (user.spotify_token_expires_at) {
    const expiryTime = new Date(user.spotify_token_expires_at).getTime();
    const now = Date.now();
    // Only refresh if expired or expiring within 60 seconds
    if (expiryTime - now > 60 * 1000) {
      return user;
    }
  }

  // Try refreshing the token proactively
  try {
    const tokens = await refreshAccessToken(user.spotify_refresh_token);
    const admin = createAdminClient();
    
    const expiryDate = new Date(Date.now() + tokens.expires_in * 1000).toISOString();

    const { error: updateError } = await admin
      .from("users")
      .update({
        spotify_access_token: tokens.access_token,
        spotify_token_expires_at: expiryDate,
        ...(tokens.refresh_token && {
          spotify_refresh_token: tokens.refresh_token,
        }),
      })
      .eq("id", user.id);

    if (updateError) {
      console.error("Failed to update user token in database:", updateError);
    }

    return {
      ...user,
      spotify_access_token: tokens.access_token,
      spotify_token_expires_at: expiryDate,
      ...(tokens.refresh_token && {
        spotify_refresh_token: tokens.refresh_token,
      }),
    };
  } catch {
    // If refresh fails, return user with existing token — caller handles errors
    return user;
  }
}
