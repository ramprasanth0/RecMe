import { cookies } from "next/headers";
import { createAdminClient } from "@/lib/supabase/admin";
import { Navbar } from "@/components/shared/Navbar";
import { ChatPageClient } from "@/components/chat/ChatPageClient";

export default async function ChatPage() {
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
      // DB failure — render page with no user context rather than crashing
    }
  }

  return (
    <>
      <Navbar user={user} />
      <main className="h-[100dvh] pt-16">
        <ChatPageClient />
      </main>
    </>
  );
}
