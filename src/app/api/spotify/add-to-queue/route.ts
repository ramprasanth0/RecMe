import { NextResponse } from "next/server";
import { getUserWithFreshToken } from "@/lib/auth/session";

export async function POST(req: Request) {
  const user = await getUserWithFreshToken();

  if (!user?.spotify_access_token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { uri } = await req.json();
    if (!uri) {
      return NextResponse.json({ error: "URI is required" }, { status: 400 });
    }

    const res = await fetch(`https://api.spotify.com/v1/me/player/queue?uri=${encodeURIComponent(uri)}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${user.spotify_access_token}`,
      },
    });

    if (res.ok) {
      return NextResponse.json({ success: true });
    } else {
      const error = await res.text();
      console.error("Failed to add to queue:", error);
      return NextResponse.json({ error: "Failed to add to queue" }, { status: res.status });
    }
  } catch (err) {
    console.error("Failed to add to queue:", err);
    return NextResponse.json({ error: "Failed to add to queue" }, { status: 500 });
  }
}
