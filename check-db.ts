import { createAdminClient } from "./src/lib/supabase/admin";

async function main() {
  const admin = createAdminClient();
  const { data, error } = await admin.from("users").select("*");
  if (error) console.error(error);
  else console.log(JSON.stringify(data, null, 2));
}

main();
