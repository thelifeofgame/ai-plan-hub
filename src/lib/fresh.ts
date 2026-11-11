import { STALE_NOINDEX_DAYS, STALE_WARN_DAYS } from "@/config/site";
import type { SiteData, VendorData } from "./types";

const DAY = 86_400_000;

export function ageDays(iso: string | null, now = Date.now()): number | null {
  if (!iso) return null;
  const t = Date.parse(iso);
  return Number.isNaN(t) ? null : (now - t) / DAY;
}

/** Row-level: older than STALE_WARN_DAYS (or no date) -> show "Pending re-check". */
export function needsRecheck(iso: string | null, now = Date.now()): boolean {
  const a = ageDays(iso, now);
  return a === null || a > STALE_WARN_DAYS;
}

/** Page-level: noindex only if there is data and EVERY public row is older than STALE_NOINDEX_DAYS. */
export function allRowsStale(dates: (string | null)[], now = Date.now()): boolean {
  if (dates.length === 0) return false;
  return dates.every((d) => {
    const a = ageDays(d, now);
    return a !== null && a > STALE_NOINDEX_DAYS;
  });
}

/** Newest date of any public row: a page is "all stale" iff its newest row is stale. */
export function vendorsAllStale(vendors: VendorData[]): boolean {
  return allRowsStale(vendors.flatMap((v) => v.plans.map((p) => p.newestVerifiedAt)));
}

export function dataAllStale(d: SiteData): boolean {
  return vendorsAllStale(d.vendors);
}

export function formatDate(iso: string | null): string {
  if (!iso) return "Not recorded";
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? "Not recorded" : d.toISOString().slice(0, 10);
}
