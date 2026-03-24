import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { Navbar } from "@/components/shared/Navbar";
import { DashboardContent } from "@/components/dashboard/DashboardContent";
import { createAdminClient } from "@/lib/supabase/admin";

export default async function HomePage() {
  const userId = cookies().get("recme_user_id")?.value;

  if (!userId) {
    redirect("/?error=unauthenticated");
  }

  let user = null;
  try {
    const admin = createAdminClient();
    const { data } = await admin
      .from("users")
      .select("display_name, avatar_url")
      .eq("id", userId)
      .single();
    user = data;
  } catch {
    redirect("/?error=user_not_found");
  }

  return (
    <>
      <Navbar user={user} />
      <DashboardContent userName={user?.display_name ?? null} />
    </>
  );
}
