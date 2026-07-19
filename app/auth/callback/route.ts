import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { saveRefreshToken } from "@/lib/gmail/tokenStore";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");

  if (code) {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    // Supabase only ever exposes provider_refresh_token here, synchronously,
    // right after this exchange — it is never retrievable again on any later
    // session refresh, so it must be captured now or it's gone for good.
    if (!error && data.session && data.user) {
      const refreshToken = (data.session as unknown as { provider_refresh_token?: string }).provider_refresh_token;
      if (refreshToken) {
        await saveRefreshToken(data.user.id, refreshToken).catch((err) => {
          console.error("Failed to save Gmail refresh token", err);
        });
      }
    }
  }

  return NextResponse.redirect(`${origin}/`);
}
