// Which programmatic pages exist right now. Everything is derived from the fact tables
// (plans, plan_prices, quotas ...), which the loader already limits to verified rows.
// The change log is never consulted: a row that loses verification disappears from the loader
// output, and the page that depends on it is no longer generated.
import { pairSlug, VS_PAIRS, type Pair } from "@/config/pairs";
import { allRowsStale } from "./fresh";
import type { PlanData, SiteData, VendorData } from "./types";

export interface ResolvedPair {
  pair: Pair;
  slug: string;
  leftVendor: VendorData;
  rightVendor: VendorData;
  left: PlanData;
  right: PlanData;
}

const newest = (dates: (string | null)[]) => dates.filter((x): x is string => !!x).sort().pop() ?? null;

/** A vs page needs both plans verified, current, sourced, and a verified price or at least one verified quota row (m1-pseo.md section 8). */
function sideOk(pd: PlanData | undefined): pd is PlanData {
  if (!pd) return false;
  if (pd.plan.plan_status === "legacy" || pd.plan.plan_status === "grandfathered") return false;
  if (!pd.plan.source_url) return false;
  const hasPrice = pd.prices.some((p) => p.billing_period === "month" && p.price_amount !== null);
  return hasPrice || pd.quotas.length > 0;
}

export function resolvePair(d: SiteData, pair: Pair): ResolvedPair | null {
  const lv = d.vendors.find((v) => v.vendor.slug === pair.left.vendor);
  const rv = d.vendors.find((v) => v.vendor.slug === pair.right.vendor);
  const left = lv?.plans.find((p) => p.plan.slug === pair.left.plan);
  const right = rv?.plans.find((p) => p.plan.slug === pair.right.plan);
  if (!lv || !rv || !sideOk(left) || !sideOk(right)) return null;
  return { pair, slug: pairSlug(pair), leftVendor: lv, rightVendor: rv, left, right };
}

export const eligiblePairs = (d: SiteData): ResolvedPair[] => VS_PAIRS.flatMap((p) => resolvePair(d, p) ?? []);

export const pairNewest = (r: ResolvedPair) => newest([r.left.newestVerifiedAt, r.right.newestVerifiedAt]);
export const pairNoindex = (r: ResolvedPair) => allRowsStale([r.left.newestVerifiedAt, r.right.newestVerifiedAt]);
export const pairLabel = (r: ResolvedPair) => `${r.left.plan.name} vs ${r.right.plan.name}`;

/** Limits / limit-reset pages need at least one verified quota row with a source (m1-pseo.md section 8). */
export function vendorHasQuotas(v: VendorData): boolean {
  return v.plans.some((p) => p.quotas.some((q) => !!q.source_url));
}

export const vendorQuotaDates = (v: VendorData) => v.plans.flatMap((p) => p.quotas.map((q) => q.last_verified_at));
export const vendorNoindex = (v: VendorData) => allRowsStale(vendorQuotaDates(v));
export const vendorNewestQuota = (v: VendorData) => newest(vendorQuotaDates(v));

/** Eligible pairs that involve a vendor or a plan, for internal links. */
export const pairsForVendor = (all: ResolvedPair[], slug: string) => all.filter((r) => r.pair.left.vendor === slug || r.pair.right.vendor === slug);
export const relatedPairs = (all: ResolvedPair[], cur: ResolvedPair, max = 3) =>
  all
    .filter(
      (r) =>
        r.slug !== cur.slug &&
        [r.pair.left, r.pair.right].some((s) => [cur.pair.left, cur.pair.right].some((c) => c.vendor === s.vendor && c.plan === s.plan)),
    )
    .slice(0, max);
