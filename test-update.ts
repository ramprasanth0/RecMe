import { createAdminClient } from "./src/lib/supabase/admin";

async function main() {
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("users")
    .update({
      spotify_id: "opha9zq1v5ob40ntid2291a55",
      spotify_access_token: "test_access_token",
      spotify_refresh_token: "test_refresh_token",
      spotify_token_expires_at: new Date().toISOString(),
    })
    .eq("id", "0cf2d98a-27c8-4811-b94c-473d2852b50f")
    .select();
    
  if (error) console.error("UPDATE ERROR:", error);
  else console.log("UPDATE SUCCESS:", JSON.stringify(data, null, 2));
}

main();
