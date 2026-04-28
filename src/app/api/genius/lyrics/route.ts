import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const url = searchParams.get("url");

  if (!url) {
    return NextResponse.json({ error: "URL is required" }, { status: 400 });
  }

  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error("Failed to fetch Genius page");
    
    const html = await res.text();
    
    // Simple regex-based scraping (Genius often changes classes, but Lyrics__Container is fairly stable)
    // We look for the Lyrics__Container divs and extract their content
    const lyricsRegex = /<div [^>]*class="[^"]*Lyrics__Container[^"]*"[^>]*>([\s\S]*?)<\/div>/g;
    let match;
    let lyricsHtml = "";
    
    while ((match = lyricsRegex.exec(html)) !== null) {
      lyricsHtml += match[1];
    }
    
    if (!lyricsHtml) {
      // Fallback for older Genius layout
      const oldRegex = /<div [^>]*class="lyrics"[^>]*>([\s\S]*?)<\/div>/;
      const oldMatch = html.match(oldRegex);
      if (oldMatch) lyricsHtml = oldMatch[1];
    }
    
    // Clean up the HTML (Genius uses <br> for newlines)
    // We want to keep <br> and some basic structure but strip scripts/ads
    const cleanLyrics = lyricsHtml
      .replace(/<script[\s\S]*?<\/script>/gi, "")
      .replace(/<style[\s\S]*?<\/style>/gi, "")
      .replace(/<button[\s\S]*?<\/button>/gi, "")
      .replace(/<div [^>]*class="[^"]*Annotation[^"]*"[^>]*>[\s\S]*?<\/div>/gi, "");

    return NextResponse.json({ lyrics: cleanLyrics });
  } catch (error: unknown) {
    console.error("Lyrics scraping error:", error);
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unknown error" }, { status: 500 });
  }
}
