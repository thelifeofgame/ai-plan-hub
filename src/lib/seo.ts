import type { Metadata } from "next";
import { canonicalUrl, getSiteUrl, isIndexingAllowed, SITE_NAME } from "@/config/site";

/**
 * Robots policy:
 *  - not production, or ALLOW_INDEXING != "true": noindex,nofollow everywhere;
 *  - production + allowed: indexable unless the page asks for noindex (stale or empty), which keeps follow.
 */
export function robots(noindex: boolean): Metadata["robots"] {
  if (!isIndexingAllowed()) return { index: false, follow: false };
  return noindex ? { index: false, follow: true } : { index: true, follow: true };
}

export function pageMetadata(opts: { path: string; title: string; description: string; noindex: boolean }): Metadata {
  return {
    title: { absolute: opts.title },
    description: opts.description,
    alternates: { canonical: canonicalUrl(opts.path) },
    robots: robots(opts.noindex),
    openGraph: { title: opts.title, description: opts.description, url: canonicalUrl(opts.path), siteName: SITE_NAME, type: "website" },
  };
}

export function titleYear(newestVerified: string | null): string {
  if (!newestVerified) return "";
  const y = new Date(newestVerified).getUTCFullYear();
  return Number.isNaN(y) ? "" : ` (${y})`;
}

export interface Crumb {
  name: string;
  path: string;
}

/** WebPage + BreadcrumbList (+ optional ItemList, FAQPage). No Offer. */
export function pageJsonLd(opts: { path: string; name: string; description: string; dateModified: string | null; crumbs: Crumb[]; items?: { name: string; path?: string }[]; faq?: { q: string; a: string }[] }) {
  const url = canonicalUrl(opts.path);
  const graph: Record<string, unknown>[] = [
    {
      "@type": "WebPage",
      "@id": `${url}#webpage`,
      url,
      name: opts.name,
      description: opts.description,
      isPartOf: { "@id": `${getSiteUrl()}/#website` },
      ...(opts.dateModified ? { dateModified: opts.dateModified } : {}),
    },
    {
      "@type": "BreadcrumbList",
      itemListElement: opts.crumbs.map((c, i) => ({ "@type": "ListItem", position: i + 1, name: c.name, item: canonicalUrl(c.path) })),
    },
  ];
  if (opts.items && opts.items.length > 0) {
    graph.push({
      "@type": "ItemList",
      itemListElement: opts.items.map((it, i) => ({ "@type": "ListItem", position: i + 1, name: it.name, ...(it.path ? { url: canonicalUrl(it.path) } : {}) })),
    });
  }
  // FAQPage only when every visible Q&A is sourced (src/lib/faq.ts only builds sourced items).
  if (opts.faq && opts.faq.length > 0) {
    graph.push({ "@type": "FAQPage", mainEntity: opts.faq.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })) });
  }
  return { "@context": "https://schema.org", "@graph": graph };
}
