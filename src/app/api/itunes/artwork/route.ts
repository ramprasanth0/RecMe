import { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const title = searchParams.get("title") ?? "";
  const artist = searchParams.get("artist") ?? "";

  if (!title && !artist) {
    return Response.json({ error: "Missing title or artist" }, { status: 400 });
  }

  try {
    const query = encodeURIComponent(`${title} ${artist}`);
    const res = await fetch(
      `https://itunes.apple.com/search?term=${query}&media=music&entity=musicTrack&limit=1`,
      { next: { revalidate: 86400 } } // cache for 24h
    );
    const data = await res.json();
    const art: string | undefined = data.results?.[0]?.artworkUrl100;
    if (!art) {
      return Response.json({ url: null });
    }
    return Response.json({ url: art.replace("100x100bb", "600x600bb") });
  } catch {
    return Response.json({ url: null });
  }
}
