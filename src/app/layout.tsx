import type { Metadata } from "next";
import Link from "next/link";
import { Analytics } from "@vercel/analytics/next";
import { JsonLd } from "@/components/JsonLd";
// M1 hook for the footer; intentionally unused in M0 (see TODO(M1) in the footer).
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { ReminderCta } from "@/components/ReminderCta";
import { canonicalUrl, getSiteUrl, SITE_NAME } from "@/config/site";
import { robots } from "@/lib/seo";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(getSiteUrl()),
  title: { default: SITE_NAME, template: `%s | ${SITE_NAME}` },
  robots: robots(false),
};

const siteJsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    { "@type": "WebSite", "@id": `${getSiteUrl()}/#website`, url: canonicalUrl("/"), name: SITE_NAME, inLanguage: "en" },
    { "@type": "Organization", "@id": `${getSiteUrl()}/#organization`, url: canonicalUrl("/"), name: SITE_NAME },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <JsonLd data={siteJsonLd} />
        <header className="site">
          <div className="wrap">
            <Link href="/" className="brand">
              {SITE_NAME}
            </Link>
            <nav aria-label="Main">
              <Link href="/compare">Compare plans</Link>
              <Link href="/changelog">Changelog</Link>
              <Link href="/status">Status pages</Link>
            </nav>
          </div>
        </header>
        <main className="wrap">{children}</main>
        <footer className="site">
          <div className="wrap">
            <p>
              {SITE_NAME} is an independent site. It is not affiliated with, sponsored by, or endorsed by the vendors whose plans it compares. Product names are trademarks of their respective owners and are
              used only to identify those plans.
            </p>
            <p>
              <Link href="/compare#methodology">How we source and compare figures</Link>
            </p>
            <p>
              Reset reminders (email or browser notifications) are planned for a later release (M1). They are not available in this version, and no signup form is shown here.
            </p>
            {/* TODO(M1): render <ReminderCta placement="footer" /> here once REMINDER_CTA_ENABLED is true and /reminders exists. Not rendered in M0. */}
          </div>
        </footer>
        <Analytics />
      </body>
    </html>
  );
}
