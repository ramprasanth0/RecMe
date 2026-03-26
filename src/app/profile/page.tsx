import { cookies } from "next/headers";
import { createAdminClient } from "@/lib/supabase/admin";
import { Navbar } from "@/components/shared/Navbar";
import { ProfileClient } from "@/components/profile/ProfileClient";
import type { DBUser } from "@/types/db";

export default async function ProfilePage() {
  const userId = cookies().get("recme_user_id")?.value;
  let user: DBUser | null = null;

  if (userId) {
    const admin = createAdminClient();
    const { data } = await admin
      .from("users")
      .select("id, email, display_name, avatar_url, spotify_id, preferences, created_at")
      .eq("id", userId)
      .single();
    user = data as DBUser | null;
  }

  return (
    <>
      <Navbar user={user} />
      <main className="min-h-screen pt-20 px-4 sm:px-6 pb-12">
        <div className="max-w-4xl mx-auto">
          <h1 className="font-display text-2xl sm:text-3xl font-bold mb-1">Profile</h1>
          <p className="text-sm text-muted-foreground mb-8">
            Manage your preferences and connected accounts.
          </p>
          <ProfileClient user={user} />
        </div>
      </main>
    </>
  );
}
