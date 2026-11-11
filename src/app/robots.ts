import type { MetadataRoute } from "next";
import { getSiteUrl, isIndexingAllowed } from "@/config/site";

// m1-indexing.md section 6: crawling stays allowed so crawlers can read per-page robots tags; the switch is the
// per-page noindex token plus the advertised sitemap. No Sitemap line unless indexing is on.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/", disallow: "/api/" },
    ...(isIndexingAllowed() ? { sitemap: `${getSiteUrl()}/sitemap.xml` } : {}),
  };
}
