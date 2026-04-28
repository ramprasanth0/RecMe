import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { exchangeCodeForTokens, getSpotifyProfile } from "@/lib/spotify/auth";
import { createAdminClient } from "@/lib/supabase/admin";
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const error = searchParams.get("error");
  const baseUrl = request.nextUrl.origin;

  // Handle user denying access
  if (error) {
    return NextResponse.redirect(`${baseUrl}/?error=spotify_denied`);
  }

  // Validate state to prevent CSRF
  const storedState = cookies().get("spotify_auth_state")?.value;
  if (!state || state !== storedState) {
    return NextResponse.redirect(`${baseUrl}/?error=state_mismatch`);
  }

  // Clear the state cookie
  cookies().delete("spotify_auth_state");

  if (!code) {
    return NextResponse.redirect(`${baseUrl}/?error=no_code`);
  }

  try {
    // Exchange code for tokens
    const tokens = await exchangeCodeForTokens(code);
    const profile = await getSpotifyProfile(tokens.access_token);

    // Upsert user in Supabase using service role
    const admin = createAdminClient();
    const currentUserId = cookies().get("recme_user_id")?.value;
    let targetUserId = currentUserId;

    if (!targetUserId) {
      // Not logged in, try to find user by spotify_id or email
      const { data: existingUser } = await admin
        .from("users")
        .select("id")
        .or(`spotify_id.eq.${profile.id},email.eq.${profile.email}`)
        .limit(1)
        .single();
      
      if (existingUser) {
        targetUserId = existingUser.id;
      }
    }

    const tokenExpiresAt = new Date(Date.now() + tokens.expires_in * 1000).toISOString();

    if (targetUserId) {
      // Update existing user
      await admin
        .from("users")
        .update({
          spotify_id: profile.id, // Ensure spotify_id is linked
          spotify_access_token: tokens.access_token,
          spotify_refresh_token: tokens.refresh_token,
          spotify_token_expires_at: tokenExpiresAt,
          display_name: profile.display_name,
          avatar_url: profile.images?.[0]?.url ?? null,
        })
        .eq("id", targetUserId);
    } else {
      // Create new user
      const { data: newUser } = await admin.from("users").insert({
        email: profile.email,
        spotify_id: profile.id,
        spotify_access_token: tokens.access_token,
        spotify_refresh_token: tokens.refresh_token,
        spotify_token_expires_at: tokenExpiresAt,
        display_name: profile.display_name,
        avatar_url: profile.images?.[0]?.url ?? null,
        preferences: {},
      }).select("id").single();
      
      if (newUser) {
        targetUserId = newUser.id;
      }
    }

    if (targetUserId) {
      cookies().set("recme_user_id", targetUserId, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 60 * 60 * 24 * 30, // 30 days
        path: "/",
      });
    }

    return NextResponse.redirect(`${baseUrl}/`);
  } catch (err) {
    console.error("Spotify callback error:", err);
    return NextResponse.redirect(`${baseUrl}/?error=auth_failed`);
  }
}
