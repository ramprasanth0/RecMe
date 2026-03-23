import { NextResponse } from "next/server";

export async function GET() {
  // Phase 2: Redirect user to Spotify OAuth authorization URL
  return NextResponse.json(
    { message: "Spotify auth start — not yet implemented" },
    { status: 501 }
  );
}
