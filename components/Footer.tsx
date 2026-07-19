import Link from "next/link";

export function Footer() {
  return (
    <footer className="border-t">
      <div className="mx-auto flex max-w-4xl flex-col items-center justify-between gap-2 px-4 py-6 text-xs text-muted-foreground sm:flex-row">
        <span>PhishGuard — free, instant phishing email analysis.</span>
        <Link href="/privacy" className="hover:text-foreground hover:underline">
          Privacy Policy
        </Link>
      </div>
    </footer>
  );
}
