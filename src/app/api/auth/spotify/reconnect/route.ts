import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getSpotifyAuthUrl } from "@/lib/spotify/auth";
import { getCurrentUser } from "@/lib/auth/session";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";
export const revalidate = 0;

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
    // Best-effort â€” proceed regardless
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

  const response = NextResponse.redirect(authUrl);
  // Bust browser cache
  response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  response.headers.set('Pragma', 'no-cache');
  response.headers.set('Expires', '0');

  return response;
}
