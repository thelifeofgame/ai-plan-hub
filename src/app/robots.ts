import type { MetadataRoute } from "next";
import { getSiteUrl, isIndexingAllowed } from "@/config/site";

// Crawling stays allowed so crawlers can read the per-page noindex tags. The sitemap is only advertised when indexing is on.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/", disallow: "/api/" },
    ...(isIndexingAllowed() ? { sitemap: `${getSiteUrl()}/sitemap.xml` } : {}),
  };
}
