import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { Navbar } from "@/components/shared/Navbar";
import { PersonalizeContent } from "@/components/personalize/PersonalizeContent";
import { createAdminClient } from "@/lib/supabase/admin";

export default async function PersonalizePage() {
  const userId = cookies().get("recme_user_id")?.value;

  if (!userId) {
    redirect("/?error=unauthenticated");
  }

  let user = null;
  try {
    const admin = createAdminClient();
    const { data } = await admin
      .from("users")
      .select("display_name, avatar_url, spotify_access_token")
      .eq("id", userId)
      .single();
    user = data;
  } catch {
    redirect("/?error=user_not_found");
  }

  return (
    <>
      <Navbar user={user} />
      <PersonalizeContent hasSpotify={!!user?.spotify_access_token} />
    </>
  );
}
