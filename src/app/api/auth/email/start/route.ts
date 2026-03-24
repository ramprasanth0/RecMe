import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { z } from "zod/v4";

const Schema = z.object({ email: z.email() });

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email } = Schema.parse(body);

    const supabase = createServerSupabaseClient();
    const redirectTo = `${request.nextUrl.origin}/api/auth/callback/email`;

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: redirectTo, shouldCreateUser: true },
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}
