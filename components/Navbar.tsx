import { ShieldCheck } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";

export function Navbar() {
  return (
    <header className="border-b">
      <div className="mx-auto flex h-14 max-w-4xl items-center justify-between px-4">
        <div className="flex items-center gap-2 font-semibold">
          <ShieldCheck size={20} className="text-primary" aria-hidden />
          <span>PhishGuard</span>
        </div>
        <ThemeToggle />
      </div>
    </header>
  );
}
