import type { Metadata } from "next";
import Link from "next/link";
import { Analytics } from "@vercel/analytics/next";
import { JsonLd } from "@/components/JsonLd";
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
              <Link href="/status">Status pages</Link>
            </nav>
          </div>
        </header>
        <main className="wrap">{children}</main>
        <footer className="site">
          <div className="wrap">
            {/* TODO(SEO copy): methodology and sources wording is a neutral placeholder. */}
            <p>
              Methodology: every figure comes from the vendor&apos;s own pricing or help page and is shown only after it has been checked. Each row links its source and shows when it was last verified. We
              do not invent message counts, reset times or rankings.
            </p>
            <p>
              This site is independent. Product names are trademarks of their owners and are used only to identify the plans we compare.
            </p>
          </div>
        </footer>
        <Analytics />
      </body>
    </html>
  );
}
