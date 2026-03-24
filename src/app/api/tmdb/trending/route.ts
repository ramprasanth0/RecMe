import { NextResponse } from "next/server";
import { getTrendingMovies } from "@/lib/tmdb";

export const revalidate = 3600;

export async function GET() {
  try {
    const data = await getTrendingMovies();
    return NextResponse.json(data);
  } catch (err) {
    console.error("TMDB trending error:", err);
    return NextResponse.json({ error: "Failed to fetch trending movies" }, { status: 500 });
  }
}
