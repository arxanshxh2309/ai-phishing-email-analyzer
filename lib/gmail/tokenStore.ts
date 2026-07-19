import { createServiceRoleClient } from "@/lib/supabase/server";

export async function saveRefreshToken(userId: string, refreshToken: string): Promise<void> {
  const supabase = createServiceRoleClient();
  const { error } = await supabase
    .from("google_oauth_tokens")
    .upsert({ user_id: userId, refresh_token: refreshToken, updated_at: new Date().toISOString() });
  if (error) throw new Error(`Failed to store Gmail token: ${error.message}`);
}

export async function getRefreshToken(userId: string): Promise<string | null> {
  const supabase = createServiceRoleClient();
  const { data, error } = await supabase
    .from("google_oauth_tokens")
    .select("refresh_token")
    .eq("user_id", userId)
    .maybeSingle();
  if (error || !data) return null;
  return data.refresh_token;
}

export async function deleteRefreshToken(userId: string): Promise<void> {
  const supabase = createServiceRoleClient();
  await supabase.from("google_oauth_tokens").delete().eq("user_id", userId);
}
