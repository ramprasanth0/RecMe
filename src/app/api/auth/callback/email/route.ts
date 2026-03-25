import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const code = searchParams.get("code");

  if (!code) {
    return NextResponse.redirect(`${origin}/?error=auth_failed`);
  }

  try {
    const supabase = createServerSupabaseClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (error || !data.user?.email) {
      return NextResponse.redirect(`${origin}/?error=auth_failed`);
    }

    const email = data.user.email;

    // Upsert into our custom users table
    const admin = createAdminClient();
    const { data: existing } = await admin
      .from("users")
      .select("id")
      .eq("email", email)
      .single();

    let userId: string;

    if (existing) {
      userId = existing.id;
    } else {
      const { data: created, error: insertError } = await admin
        .from("users")
        .insert({
          email,
          display_name: email.split("@")[0],
          preferences: {},
        })
        .select("id")
        .single();

      if (insertError || !created) {
        return NextResponse.redirect(`${origin}/?error=auth_failed`);
      }

      userId = created.id;
    }

    // Set session cookie
    cookies().set("recme_user_id", userId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 30,
      path: "/",
    });

    return NextResponse.redirect(`${origin}/`);
  } catch {
    return NextResponse.redirect(`${origin}/?error=auth_failed`);
  }
}
