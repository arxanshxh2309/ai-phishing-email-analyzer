import { MailSearch } from "lucide-react";

export function EmptyState() {
  return (
    <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed py-16 text-center">
      <MailSearch size={32} className="text-muted-foreground" aria-hidden />
      <div>
        <p className="text-sm font-medium">No email analyzed yet</p>
        <p className="mt-1 text-xs text-muted-foreground">Paste an email or upload a .eml file to get started.</p>
      </div>
    </div>
  );
}
