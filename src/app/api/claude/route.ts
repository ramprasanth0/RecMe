import { NextResponse } from "next/server";

export async function POST() {
  // Phase 5: Claude streaming recommendation endpoint
  return NextResponse.json(
    { message: "Claude AI endpoint — not yet implemented" },
    { status: 501 }
  );
}
