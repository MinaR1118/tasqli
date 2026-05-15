import { createClient } from "@supabase/supabase-js";

/**
 * Service-role client — bypasses RLS.
 * Use only in trusted server contexts (webhooks, cron jobs).
 * Never expose the service role key to the client.
 */
export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );
}
