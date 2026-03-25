import { cookies } from "next/headers";
import { Navbar } from "@/components/shared/Navbar";
import { LandingContent } from "@/components/landing/LandingContent";
import { createAdminClient } from "@/lib/supabase/admin";

export default async function HomePage() {
  // SSR auth detection — no redirect, no layout shift
  const userId = cookies().get("recme_user_id")?.value;
  let user = null;

  if (userId) {
    try {
      const admin = createAdminClient();
      const { data } = await admin
        .from("users")
        .select("display_name, avatar_url")
        .eq("id", userId)
        .single();
      user = data;
    } catch {
      // Invalid cookie — treat as guest
    }
  }

  return (
    <>
      <Navbar user={user} />
      <LandingContent
        isAuthenticated={!!user}
        userName={user?.display_name}
      />
    </>
  );
}
