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
    
    // Scrape all data-lyrics-container elements
    const parts = html.split('data-lyrics-container="true"');
    let lyricsHtml = "";
    
    if (parts.length > 1) {
      for (let i = 1; i < parts.length; i++) {
        const part = parts[i];
        const startIdx = part.indexOf('>');
        if (startIdx !== -1) {
          let content = part.substring(startIdx + 1);
          
          // Truncate at the end of the lyrics section
          const endMarkers = ['<div class="RightSidebar', '<div class="LyricsFooter', '<div data-lyrics-container="false"'];
          let firstEndIdx = content.length;
          for (const marker of endMarkers) {
            const idx = content.indexOf(marker);
            if (idx !== -1 && idx < firstEndIdx) {
              firstEndIdx = idx;
            }
          }
          content = content.substring(0, firstEndIdx);
          
          // Remove ad/header blocks completely (they use data-exclude-from-selection="true")
          let idx = 0;
          while ((idx = content.indexOf('data-exclude-from-selection="true"', idx)) !== -1) {
            const divStart = content.lastIndexOf('<div', idx);
            if (divStart !== -1) {
              let divCount = 1;
              let j = content.indexOf('>', idx) + 1;
              while (j < content.length && divCount > 0) {
                if (content.startsWith('<div', j)) divCount++;
                else if (content.startsWith('</div', j)) divCount--;
                j++;
              }
              const closeIdx = content.indexOf('>', j - 1);
              if (closeIdx !== -1) j = closeIdx + 1;
              
              content = content.substring(0, divStart) + content.substring(j);
              idx = divStart;
            } else {
              idx += 'data-exclude-from-selection="true"'.length;
            }
          }
          
          lyricsHtml += content + "<br/>";
        }
      }
    } else {
      // Fallback for older Genius layout
      const oldRegex = /<div [^>]*class="lyrics"[^>]*>([\s\S]*?)<\/div>/;
      const oldMatch = html.match(oldRegex);
      if (oldMatch) lyricsHtml = oldMatch[1];
    }
    
    if (!lyricsHtml) {
      return NextResponse.json({ error: "Could not extract lyrics" }, { status: 404 });
    }
    
    // Clean up the HTML
    let cleanLyrics = lyricsHtml
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
      .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, "")
      .replace(/<br[^>]*>/gi, '\n'); // Temporarily convert br to newlines
      
    // Strip all other tags except basic formatting
    cleanLyrics = cleanLyrics.replace(/<[^>]+>/g, (match) => {
      const lower = match.toLowerCase();
      if (lower === '<i>' || lower === '</i>' || lower === '<b>' || lower === '</b>') {
        return match;
      }
      return '';
    });
    
    // Decode HTML entities
    cleanLyrics = cleanLyrics
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#x27;/g, "'")
      .replace(/&#x20;/g, ' ');
      
    // Convert newlines back to <br/> and remove extra blank lines
    cleanLyrics = cleanLyrics.replace(/\n+/g, '<br/>').trim();

    return NextResponse.json({ lyrics: cleanLyrics });
  } catch (error: unknown) {
    console.error("Lyrics scraping error:", error);
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unknown error" }, { status: 500 });
  }
}
