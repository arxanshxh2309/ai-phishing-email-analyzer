import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy — PhishGuard",
  description: "How PhishGuard handles your data, including Gmail access.",
};

export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-12 text-sm leading-relaxed text-muted-foreground">
      <h1 className="mb-2 text-2xl font-semibold text-foreground">Privacy Policy</h1>
      <p className="mb-8 text-xs">Last updated: 2026</p>

      <section className="mb-8">
        <h2 className="mb-2 text-base font-semibold text-foreground">What PhishGuard does</h2>
        <p>
          PhishGuard analyzes email messages to detect phishing indicators — spoofed senders, malicious links,
          social-engineering language, and dangerous attachments — and shows you a risk score and explanation.
          You can use it by pasting raw email text, uploading a <code>.eml</code> file, or connecting your Gmail
          account.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="mb-2 text-base font-semibold text-foreground">Paste and upload — no storage</h2>
        <p>
          When you paste an email or upload a file, it is analyzed transiently in memory purely to compute a
          result, and returned directly to your browser. We do not store the email content, sender, subject, or
          body in any database. Each analysis request is independent and stateless.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="mb-2 text-base font-semibold text-foreground">Gmail access (read-only)</h2>
        <p className="mb-3">
          If you choose to connect Gmail, we request Google&apos;s <code>gmail.readonly</code> permission — the ability
          to read, but never send, delete, or modify your email — through Google&apos;s own sign-in screen. We never
          see or store your Google password.
        </p>
        <p className="mb-3">We use this access only to:</p>
        <ul className="mb-3 list-inside list-disc space-y-1">
          <li>List basic metadata (subject, sender, date) for your most recent inbox messages, to build a summary list.</li>
          <li>Fetch the full content of a specific message, only when you open it, to run the same phishing analysis available for pasted/uploaded email.</li>
        </ul>
        <p className="mb-3">
          We do not store the content of any Gmail message. We do store the OAuth refresh token that lets us
          re-access your Gmail without asking you to sign in every time — this token is kept in our database
          (Supabase) with no public access policies of any kind; only our server can read it, and only after
          verifying it&apos;s genuinely your own signed-in session. It is deleted immediately when you click
          <strong> Disconnect</strong>.
        </p>
        <p>
          You can also revoke this app&apos;s access at any time directly from your Google Account, under{" "}
          <strong>Security → Third-party apps with account access</strong>, independent of anything in our app.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="mb-2 text-base font-semibold text-foreground">Other outbound lookups</h2>
        <p>
          Some checks make limited, targeted outbound requests as part of analyzing an email: a domain-age lookup
          for the sender and linked domains, and — only when you explicitly click &quot;Resolve real destination&quot; on a
          specific link — following that link&apos;s redirects to see where it actually leads. These lookups only ever
          send the specific domain or URL being checked, never your email content, and are protected against being
          used to reach internal/private network addresses.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="mb-2 text-base font-semibold text-foreground">What we don&apos;t do</h2>
        <ul className="list-inside list-disc space-y-1">
          <li>We do not sell or share your data with third parties for advertising or any other purpose.</li>
          <li>We do not use your email content or Gmail data to train AI models.</li>
          <li>We do not retain pasted/uploaded email content after your scan completes.</li>
        </ul>
      </section>

      <section className="mb-8">
        <h2 className="mb-2 text-base font-semibold text-foreground">Third-party services we use</h2>
        <ul className="list-inside list-disc space-y-1">
          <li><strong>Google</strong> — OAuth sign-in and the Gmail API, only if you connect Gmail.</li>
          <li><strong>Supabase</strong> — hosts your account/session and, if connected, your Gmail refresh token.</li>
          <li><strong>Vercel</strong> — hosts the application itself.</li>
        </ul>
      </section>

      <section>
        <h2 className="mb-2 text-base font-semibold text-foreground">Contact</h2>
        <p>
          Questions about this policy or your data can be sent to{" "}
          <a href="mailto:skatexo.123654@gmail.com" className="text-foreground underline">
            skatexo.123654@gmail.com
          </a>
          .
        </p>
      </section>
    </div>
  );
}
