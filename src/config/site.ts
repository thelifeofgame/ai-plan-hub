// Single place for site-wide settings. No secrets here.

/** A row not re-checked for more than this many days shows a "Pending re-check" notice on that row only. */
export const STALE_WARN_DAYS = 7;
/** A page is noindex only when ALL its public rows are older than this many days. */
export const STALE_NOINDEX_DAYS = 21;

/** Working site name. Placeholder: domain/brand not decided; no vendor trademarks. */
export const SITE_NAME = "AI Plan Limits";

/** Reminder CTA is hidden until the signup form is live (M1). */
export const REMINDER_CTA_ENABLED = false;

/** ISR: pages regenerate at most this often (seconds); on-demand revalidation via /api/revalidate. */
export const REVALIDATE_SECONDS = 3600;

/** Canonical origin: SITE_URL, else the Vercel host, else localhost. No trailing slash. */
export function getSiteUrl(): string {
  const raw =
    process.env.SITE_URL ||
    (process.env.VERCEL_PROJECT_PRODUCTION_URL && process.env.VERCEL_ENV === "production"
      ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
      : process.env.VERCEL_URL
        ? `https://${process.env.VERCEL_URL}`
        : "http://localhost:3000");
  return raw.replace(/\/+$/, "");
}

/** Indexing is allowed only on the production environment AND with ALLOW_INDEXING=true. */
export function isIndexingAllowed(): boolean {
  return process.env.VERCEL_ENV === "production" && process.env.ALLOW_INDEXING === "true";
}

/** Absolute canonical URL for a path ("/" or "/compare"), apex, no trailing slash. */
export function canonicalUrl(path: string): string {
  const base = getSiteUrl();
  return path === "/" ? `${base}/` : `${base}${path.replace(/\/+$/, "")}`;
}
