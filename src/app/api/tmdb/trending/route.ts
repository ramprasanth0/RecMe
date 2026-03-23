import { NextResponse } from "next/server";

export async function GET() {
  // Phase 3: TMDB trending movies (ISR, revalidate: 3600)
  return NextResponse.json(
    { message: "TMDB trending — not yet implemented" },
    { status: 501 }
  );
}
