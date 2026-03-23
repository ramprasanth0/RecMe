import { NextResponse } from "next/server";

export async function GET() {
  // Phase 5: Auto-trigger personalized recommendations
  return NextResponse.json(
    { message: "Auto recommendations — not yet implemented" },
    { status: 501 }
  );
}
