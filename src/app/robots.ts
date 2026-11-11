import type { MetadataRoute } from "next";
import { getSiteUrl, isIndexingAllowed } from "@/config/site";

// Indexing off (previews, or production without ALLOW_INDEXING=true): block all crawling, no sitemap.
// Indexing on: allow crawling and advertise the sitemap. Pages still carry their own noindex tags where needed.
export default function robots(): MetadataRoute.Robots {
  if (!isIndexingAllowed()) return { rules: { userAgent: "*", disallow: "/" } };
  return {
    rules: { userAgent: "*", allow: "/", disallow: "/api/" },
    sitemap: `${getSiteUrl()}/sitemap.xml`,
  };
}
