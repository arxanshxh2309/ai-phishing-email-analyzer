import { createServerClient } from "@supabase/ssr";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";

/** Session-scoped server client — respects the caller's own auth session and RLS. */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
        } catch {
          // Called from a Server Component render — safe to ignore since
          // middleware.ts is what actually persists refreshed sessions.
        }
      },
    },
  });
}

/**
 * Service-role client — bypasses Row Level Security entirely. Only ever use
 * this after independently verifying the caller's own session server-side
 * first (e.g. via `createClient()` above), and only for tables with no
 * public policies (like `google_oauth_tokens`). Never expose this client or
 * its key to anything reachable by unauthenticated input.
 */
export function createServiceRoleClient() {
  return createSupabaseClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
