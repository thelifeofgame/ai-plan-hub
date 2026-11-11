import type { MetadataRoute } from "next";
import { canonicalUrl, isIndexingAllowed } from "@/config/site";
import { allRowsStale } from "@/lib/fresh";
import { loadSiteData } from "@/lib/load";

export const revalidate = 3600;

// Indexable URLs only. Empty while indexing is off (preview hosts, or production without ALLOW_INDEXING=true). /status stays out in M0.
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  if (!isIndexingAllowed()) return [];
  const d = await loadSiteData();
  const all = d.vendors.flatMap((v) => v.plans.map((p) => p.newestVerifiedAt));
  const out: MetadataRoute.Sitemap = [];
  if (d.vendors.length > 0 && !allRowsStale(all)) {
    out.push({ url: canonicalUrl("/") }, { url: canonicalUrl("/compare") });
  }
  for (const v of d.vendors) {
    if (v.plans.length > 0 && !allRowsStale(v.plans.map((p) => p.newestVerifiedAt))) out.push({ url: canonicalUrl(`/${v.vendor.slug}`) });
  }
  return out;
}
