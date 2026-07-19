"use client";

import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";
import { GmailConnect } from "@/components/GmailConnect";
import { GmailInboxDashboard } from "@/components/GmailInboxDashboard";

export function GmailTab() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user);
      setLoading(false);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  async function connect() {
    const supabase = createClient();
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        scopes: "https://www.googleapis.com/auth/gmail.readonly",
        queryParams: { access_type: "offline", prompt: "consent" },
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
  }

  async function disconnect() {
    const supabase = createClient();
    await supabase.auth.signOut();
  }

  if (loading) return null;

  return (
    <div className="flex flex-col gap-6">
      <GmailConnect user={user} onConnect={connect} onDisconnect={disconnect} />
      {user && <GmailInboxDashboard key={user.id} />}
    </div>
  );
}
