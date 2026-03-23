import { NextResponse } from "next/server";

export async function GET() {
  // Phase 2: Spotify OAuth callback handler
  return NextResponse.json(
    { message: "Spotify callback — not yet implemented" },
    { status: 501 }
  );
}
