import { NextResponse } from "next/server";
import { getUserWithFreshToken } from "@/lib/auth/session";

export async function GET(req: Request) {
  const user = await getUserWithFreshToken();

  if (!user?.spotify_access_token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const ids = searchParams.get("ids");
  if (!ids) {
    return NextResponse.json({ error: "Missing ids" }, { status: 400 });
  }

  try {
    const res = await fetch(`https://api.spotify.com/v1/me/tracks/contains?ids=${encodeURIComponent(ids)}`, {
      headers: {
        Authorization: `Bearer ${user.spotify_access_token}`,
      },
    });

    if (!res.ok) {
        const errorText = await res.text();
        return NextResponse.json({ error: `Spotify API error: ${errorText}` }, { status: res.status });
    }
    const data = await res.json();
    return NextResponse.json({ saved: data });
  } catch (err: unknown) {
    console.error("Failed to check liked songs:", err);
    return NextResponse.json({ error: "Failed to check liked songs", details: err instanceof Error ? err.message : String(err) }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  const user = await getUserWithFreshToken();

  if (!user?.spotify_access_token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { ids } = await req.json();
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ error: "Missing or invalid ids" }, { status: 400 });
    }

    const uris = ids.map((id: string) => id.startsWith('spotify:') ? id : `spotify:track:${id}`);

    const res = await fetch(`https://api.spotify.com/v1/me/library?uris=${encodeURIComponent(uris.join(','))}`, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${user.spotify_access_token}`,
        "Content-Type": "application/json",
      },
    });

    if (!res.ok) {
        const errorText = await res.text();
        console.error(`[PUT /me/library] Spotify API 403 Error Details:`, errorText);
        return NextResponse.json({ error: `Spotify API error: ${errorText}` }, { status: res.status });
    }
    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    console.error("Failed to add to liked songs:", err);
    return NextResponse.json({ error: "Failed to add to liked songs", details: err instanceof Error ? err.message : String(err) }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  const user = await getUserWithFreshToken();

  if (!user?.spotify_access_token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { ids } = await req.json();
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ error: "Missing or invalid ids" }, { status: 400 });
    }

    const uris = ids.map((id: string) => id.startsWith('spotify:') ? id : `spotify:track:${id}`);

    const res = await fetch(`https://api.spotify.com/v1/me/library?uris=${encodeURIComponent(uris.join(','))}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${user.spotify_access_token}`,
        "Content-Type": "application/json",
      },
    });

    if (!res.ok) {
        const errorText = await res.text();
        console.error(`[DELETE /me/library] Spotify API 403 Error Details:`, errorText);
        return NextResponse.json({ error: `Spotify API error: ${errorText}` }, { status: res.status });
    }
    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    console.error("Failed to remove from liked songs:", err);
    return NextResponse.json({ error: "Failed to remove from liked songs", details: err instanceof Error ? err.message : String(err) }, { status: 500 });
  }
}
