import { AlertCircle } from "lucide-react";

export function ErrorState({ message }: { message: string }) {
  return (
    <div
      className="flex items-start gap-3 rounded-lg border p-4 text-sm"
      style={{
        borderColor: "color-mix(in oklch, var(--status-critical) 35%, var(--border))",
        backgroundColor: "color-mix(in oklch, var(--status-critical) 6%, transparent)",
      }}
    >
      <AlertCircle size={18} className="mt-0.5 shrink-0" style={{ color: "var(--status-critical)" }} aria-hidden />
      <div>
        <p className="font-medium">Couldn&apos;t analyze this email</p>
        <p className="mt-0.5 text-muted-foreground">{message}</p>
      </div>
    </div>
  );
}
