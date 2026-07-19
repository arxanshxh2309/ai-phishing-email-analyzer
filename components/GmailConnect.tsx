"use client";

import { LogOut, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { User } from "@supabase/supabase-js";

export function GmailConnect({
  user,
  onConnect,
  onDisconnect,
}: {
  user: User | null;
  onConnect: () => void;
  onDisconnect: () => void;
}) {
  if (user) {
    return (
      <div className="flex items-center justify-between rounded-lg border bg-card p-3 text-sm">
        <span className="flex items-center gap-2">
          <Mail size={16} className="text-muted-foreground" />
          Connected as <span className="font-medium">{user.email}</span>
        </span>
        <Button variant="outline" size="sm" className="gap-1.5" onClick={onDisconnect}>
          <LogOut size={14} />
          Disconnect
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed py-10 text-center">
      <Mail size={28} className="text-muted-foreground" />
      <div>
        <p className="text-sm font-medium">Connect Gmail to auto-scan your inbox</p>
        <p className="mt-1 max-w-sm text-xs text-muted-foreground">
          Signs in with Google — we never see or store your password, only a read-only Gmail permission you grant
          directly through Google&apos;s own consent screen.
        </p>
      </div>
      <Button onClick={onConnect} className="gap-2">
        <Mail size={16} />
        Connect Gmail
      </Button>
    </div>
  );
}
