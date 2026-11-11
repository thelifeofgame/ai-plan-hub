// Sitemap split by page type (m1-indexing.md section 5). Only URLs that are eligible for index,follow are listed.
// While indexing is off every sitemap is an empty set and nothing is advertised.
import { canonicalUrl, getSiteUrl, isIndexingAllowed } from "@/config/site";
import { allRowsStale } from "./fresh";
import { loadChangeLog, loadSiteData } from "./load";
import { eligiblePairs, pairNewest, pairNoindex, vendorHasQuotas, vendorNewestQuota, vendorNoindex } from "./pages";

export interface Entry {
  url: string;
  lastmod?: string;
}

const day = (iso: string | null) => (iso ? iso.slice(0, 10) : undefined);
const entry = (path: string, iso: string | null): Entry => ({ url: canonicalUrl(path), lastmod: day(iso) });

export const SITEMAP_FILES = ["core", "limits", "reset", "vs", "changelog"] as const;
export type SitemapKind = (typeof SITEMAP_FILES)[number];
export const sitemapPath = (k: SitemapKind) => `/sitemap-${k}.xml`;

export async function entriesFor(kind: SitemapKind): Promise<Entry[]> {
  if (!isIndexingAllowed()) return [];
  const d = await loadSiteData();
  switch (kind) {
    case "core": {
      const all = d.vendors.flatMap((v) => v.plans.map((p) => p.newestVerifiedAt));
      const newest = all.filter((x): x is string => !!x).sort().pop() ?? null;
      const out: Entry[] = [];
      if (d.vendors.length > 0 && !allRowsStale(all)) out.push(entry("/", newest), entry("/compare", newest));
      for (const v of d.vendors) {
        const dates = v.plans.map((p) => p.newestVerifiedAt);
        if (v.plans.length > 0 && !allRowsStale(dates)) out.push(entry(`/${v.vendor.slug}`, dates.filter((x): x is string => !!x).sort().pop() ?? null));
      }
      return out;
    }
    case "limits":
    case "reset":
      return d.vendors
        .filter((v) => vendorHasQuotas(v) && !vendorNoindex(v))
        .map((v) => entry(`/${v.vendor.slug}/${kind === "limits" ? "limits" : "limit-reset"}`, vendorNewestQuota(v)));
    case "vs":
      return eligiblePairs(d)
        .filter((r) => !pairNoindex(r))
        .map((r) => entry(`/${r.slug}`, pairNewest(r)));
    case "changelog": {
      const log = await loadChangeLog();
      if (log.unavailable || log.entries.length === 0) return [];
      const newest = log.entries.map((e) => e.confirmed_at ?? e.detected_at).sort().pop() ?? null;
      return [entry("/changelog", newest)];
    }
  }
}

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;");

export function urlsetXml(entries: Entry[]): string {
  const items = entries.map((e) => `<url><loc>${esc(e.url)}</loc>${e.lastmod ? `<lastmod>${e.lastmod}</lastmod>` : ""}</url>`).join("\n");
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${items}\n</urlset>\n`;
}

/** Sitemap index: lists only the child sitemaps that have URLs. Empty set while indexing is off. */
export async function indexXml(): Promise<string> {
  if (!isIndexingAllowed()) return urlsetXml([]);
  const items: string[] = [];
  for (const k of SITEMAP_FILES) {
    const e = await entriesFor(k);
    if (e.length === 0) continue;
    const last = e.map((x) => x.lastmod).filter((x): x is string => !!x).sort().pop();
    items.push(`<sitemap><loc>${esc(`${getSiteUrl()}${sitemapPath(k)}`)}</loc>${last ? `<lastmod>${last}</lastmod>` : ""}</sitemap>`);
  }
  return `<?xml version="1.0" encoding="UTF-8"?>\n<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${items.join("\n")}\n</sitemapindex>\n`;
}

export const xmlResponse = (body: string) => new Response(body, { headers: { "content-type": "application/xml; charset=utf-8" } });
