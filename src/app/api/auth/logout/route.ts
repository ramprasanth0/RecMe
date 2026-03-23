import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function POST(request: NextRequest) {
  cookies().delete("recme_user_id");
  return NextResponse.redirect(new URL("/", request.url));
}
