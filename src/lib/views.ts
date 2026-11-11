// Turns database rows into plain, serializable view objects used by pages and the client filter.
import { annualPrice, domainOf, featureLabel, limitLabel, monthlyPrice, windowLabel } from "./format";
import { needsRecheck } from "./fresh";
import type { PlanData, VendorData } from "./types";

export interface LimitView {
  label: string;
  limit: string;
  window: string;
  quote: string | null;
  resetRule: string | null;
  resetIn: string | null;
  shared: string | null;
  rateNotes: string | null;
  sourceUrl: string | null;
  lastVerified: string | null;
}

export interface PlanView {
  vendorSlug: string;
  vendorName: string;
  planSlug: string;
  planName: string;
  planStatus: string | null;
  audience: string | null;
  isFree: boolean;
  monthly: string | null;
  annual: string | null;
  priceNotes: string[];
  models: { name: string; notes: string | null }[];
  limits: LimitView[];
  overage: string | null;
  /** Oldest verified date among this plan's public rows (conservative). */
  lastVerified: string | null;
  recheck: boolean;
  sources: { url: string; domain: string }[];
}

export function planView(v: VendorData, pd: PlanData): PlanView {
  const baseName = (slug: string) => v.plans.find((p) => p.plan.slug === slug)?.plan.name ?? slug;
  const monthly = monthlyPrice(pd.prices);
  const free = pd.prices.some((p) => p.billing_period === "month" && p.price_amount === 0);
  return {
    vendorSlug: v.vendor.slug,
    vendorName: v.vendor.name,
    planSlug: pd.plan.slug,
    planName: pd.plan.name,
    planStatus: pd.plan.plan_status,
    audience: pd.plan.audience,
    isFree: free,
    monthly,
    annual: annualPrice(pd.prices),
    priceNotes: pd.prices.map((p) => p.price_notes).filter((n): n is string => !!n),
    models: pd.models.map((m) => ({ name: m.model.name, notes: m.link.access_notes })),
    limits: pd.quotas.map((q) => ({
      label: featureLabel(q),
      limit: limitLabel(q, pd.plan.slug, baseName),
      window: windowLabel(q),
      quote: q.source_quote,
      resetRule: q.reset_rule,
      resetIn: q.reset_visible_in,
      shared: q.shared_pool_notes,
      rateNotes: q.rate_limit_notes,
      sourceUrl: q.source_url,
      lastVerified: q.last_verified_at,
    })),
    overage: pd.plan.overage_options,
    lastVerified: pd.oldestVerifiedAt,
    recheck: needsRecheck(pd.oldestVerifiedAt),
    sources: pd.sources.map((url) => ({ url, domain: domainOf(url) })),
  };
}

export const allPlanViews = (vendors: VendorData[]): PlanView[] => vendors.flatMap((v) => v.plans.map((p) => planView(v, p)));

/** Home indexability (ia.md 3.1): at least two vendors with a verified priced/free plan, a source and a date. */
export function homeHasEnoughData(vendors: VendorData[]): boolean {
  return (
    vendors.filter((v) => v.plans.some((p) => p.prices.some((x) => x.billing_period === "month" && x.price_amount !== null) && p.sources.length > 0 && p.newestVerifiedAt)).length >= 2
  );
}
