import { NextResponse } from "next/server";
import { getUserWithFreshToken } from "@/lib/auth/session";
import { getQueue } from "@/lib/spotify";

export async function GET() {
  const user = await getUserWithFreshToken();

  if (!user?.spotify_access_token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const queue = await getQueue(user.spotify_access_token);
    return NextResponse.json(queue);
  } catch (err) {
    console.error("Failed to fetch queue:", err);
    return NextResponse.json({ error: "Failed to fetch queue" }, { status: 500 });
  }
}
