import { NextResponse } from "next/server";

export async function POST() {
  // Phase 5: Gemini streaming recommendation endpoint
  return NextResponse.json(
    { message: "Gemini AI endpoint — not yet implemented" },
    { status: 501 }
  );
}
