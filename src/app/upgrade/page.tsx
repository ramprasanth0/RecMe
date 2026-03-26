import { cookies } from "next/headers";
import { Navbar } from "@/components/shared/Navbar";
import { createAdminClient } from "@/lib/supabase/admin";
import { UpgradeContent } from "@/components/upgrade/UpgradeContent";

export default async function UpgradePage() {
  const userId = cookies().get("recme_user_id")?.value;
  let user = null;

  if (userId) {
    try {
      const admin = createAdminClient();
      const { data } = await admin
        .from("users")
        .select("display_name, avatar_url, is_pro")
        .eq("id", userId)
        .single();
      user = data;
    } catch {
      // treat as guest
    }
  }

  return (
    <>
      <Navbar user={user} isPro={user?.is_pro ?? false} />
      <UpgradeContent isPro={user?.is_pro ?? false} isAuthenticated={!!user} />
    </>
  );
}
