import { NextResponse } from "next/server";
import { searchGenius } from "@/lib/genius";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q");

  if (!q) {
    return NextResponse.json({ error: "Query parameter 'q' is required" }, { status: 400 });
  }

  try {
    const hits = await searchGenius(q);
    
    // We usually want the first hit that matches best
    // Each hit has a 'result' object with 'id', 'title', 'primary_artist', etc.
    return NextResponse.json({ hits });
  } catch (error: unknown) {
    console.error("Genius search error:", error);
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unknown error" }, { status: 500 });
  }
}
