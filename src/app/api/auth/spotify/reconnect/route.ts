import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getSpotifyAuthUrl } from "@/lib/spotify/auth";
import { getCurrentUser } from "@/lib/auth/session";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET() {
  // Clear stored Spotify tokens so the callback issues a fresh grant
  try {
    const user = await getCurrentUser();
    if (user) {
      const admin = createAdminClient();
      await admin
        .from("users")
        .update({ spotify_access_token: null, spotify_refresh_token: null })
        .eq("id", user.id);
    }
  } catch {
    // Best-effort — proceed regardless
  }

  const state = crypto.randomUUID();
  cookies().set("spotify_auth_state", state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 600,
    path: "/",
  });

  // show_dialog=true forces Spotify to show the permissions screen
  const authUrl = getSpotifyAuthUrl(state, true);
  return NextResponse.redirect(authUrl);
}
