import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getSpotifyAuthUrl } from "@/lib/spotify/auth";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  // Generate a random state for CSRF protection
  const state = crypto.randomUUID();

  // Store state in a cookie to verify on callback
  cookies().set("spotify_auth_state", state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 600, // 10 minutes
    path: "/",
  });

  // show_dialog=true forces Spotify to re-evaluate scopes and show the approval screen
  const authUrl = getSpotifyAuthUrl(state, true);
  
  const response = NextResponse.redirect(authUrl);
  // Bust browser cache
  response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  response.headers.set('Pragma', 'no-cache');
  response.headers.set('Expires', '0');
  
  return response;
}
