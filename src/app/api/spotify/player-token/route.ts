import { NextResponse } from "next/server";
import { getUserWithFreshToken } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const user = await getUserWithFreshToken();

    if (!user || !user.spotify_access_token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    return NextResponse.json({ accessToken: user.spotify_access_token });
  } catch (error) {
    console.error("Failed to get player token:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
