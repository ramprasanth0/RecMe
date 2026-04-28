import { NextResponse } from "next/server";
import { getGeniusSong } from "@/lib/genius";

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const id = params.id;

  if (!id) {
    return NextResponse.json({ error: "Song ID is required" }, { status: 400 });
  }

  try {
    const song = await getGeniusSong(parseInt(id));
    return NextResponse.json({ song });
  } catch (error: any) {
    console.error("Genius song fetch error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
