// FAQ items are built only from verified fields that have a source URL. An empty field means no question
// (m1-pseo.md section 6). Every item carries the source it was built from, and FAQPage JSON-LD is emitted
// only for the items that exist, so the schema never contains an unsourced answer.
import { domainOf, featureLabel, limitLabel, monthlyPrice } from "./format";
import type { PlanData, VendorData } from "./types";
import { monthlyAmountUsd } from "./format";

export interface FaqItem {
  q: string;
  a: string;
  sources: string[];
}

const uniq = <T,>(xs: T[]) => Array.from(new Set(xs));
const baseNameOf = (v: VendorData) => (slug: string) => v.plans.find((p) => p.plan.slug === slug)?.plan.name ?? slug;

export function costFaq(pd: PlanData): FaqItem[] {
  const row = pd.prices.find((p) => p.billing_period === "month" && p.price_amount !== null && p.source_url);
  if (!row) return [];
  const price = monthlyPrice([row]);
  return [{ q: `How much does ${pd.plan.name} cost?`, a: `${pd.plan.name} is listed at ${price}.${row.price_notes ? ` ${row.price_notes}` : ""}`, sources: [row.source_url as string] }];
}

export function limitsFaq(v: VendorData, pd: PlanData): FaqItem[] {
  const rows = pd.quotas.filter((q) => q.source_url).slice(0, 4);
  if (rows.length === 0) return [];
  const base = baseNameOf(v);
  const a = rows.map((q) => `${featureLabel(q)}: ${limitLabel(q, pd.plan.slug, base)}.${q.source_quote ? ` Official wording: "${q.source_quote}"` : ""}`).join(" ");
  return [{ q: `What are the usage limits on ${pd.plan.name}?`, a, sources: uniq(rows.map((q) => q.source_url as string)) }];
}

export function resetFaq(v: VendorData): FaqItem[] {
  const rows = v.plans.flatMap((p) => p.quotas.filter((q) => q.reset_rule && q.source_url));
  if (rows.length === 0) return [];
  const rules = uniq(rows.map((q) => q.reset_rule as string)).slice(0, 2);
  return [
    {
      q: `When does the ${v.vendor.name} usage limit reset?`,
      a: `Usage limits on ${v.vendor.name} reset on a window- or account-assigned schedule. ${rules.join(" ")}`,
      sources: uniq(rows.slice(0, 2).map((q) => q.source_url as string)),
    },
  ];
}

export function whereFaq(v: VendorData): FaqItem[] {
  const rows = v.plans.flatMap((p) => p.quotas.filter((q) => q.reset_visible_in && q.source_url));
  if (rows.length === 0) return [];
  const where = uniq(rows.map((q) => q.reset_visible_in as string));
  return [{ q: `Where can I see my ${v.vendor.name} reset time?`, a: `Check the next reset time in the product at ${where.join("; ")}.`, sources: uniq(rows.map((q) => q.source_url as string)).slice(0, 2) }];
}

export function overageFaq(pd: PlanData): FaqItem[] {
  if (!pd.plan.overage_options || !pd.plan.source_url) return [];
  return [{ q: `What happens when I reach a ${pd.plan.name} limit?`, a: pd.plan.overage_options, sources: [pd.plan.source_url] }];
}

export function poolFaq(v: VendorData): FaqItem[] {
  const row = v.plans.flatMap((p) => p.quotas).find((q) => q.shared_pool_notes && q.source_url);
  if (!row) return [];
  return [{ q: `Do ${v.vendor.name} features share one usage pool?`, a: row.shared_pool_notes as string, sources: [row.source_url as string] }];
}

export function vsFaq(a: { v: VendorData; pd: PlanData }, b: { v: VendorData; pd: PlanData }): FaqItem[] {
  const out: FaqItem[] = [];
  const ra = a.pd.prices.find((p) => p.billing_period === "month" && p.price_amount !== null && p.source_url);
  const rb = b.pd.prices.find((p) => p.billing_period === "month" && p.price_amount !== null && p.source_url);
  if (ra && rb) {
    const pa = monthlyPrice([ra]);
    const pb = monthlyPrice([rb]);
    const same = ra.currency === rb.currency && ra.price_unit === rb.price_unit;
    const ua = monthlyAmountUsd([ra]);
    const ub = monthlyAmountUsd([rb]);
    const tail =
      same && ua !== null && ub !== null && ua !== ub
        ? ` The lower list price is ${ua < ub ? a.pd.plan.name : b.pd.plan.name}.`
        : same && ua === ub
          ? " The two list prices are equal."
          : " The prices use different currencies or price units, so we do not name a cheaper plan.";
    out.push({ q: `Which is cheaper, ${a.pd.plan.name} or ${b.pd.plan.name}?`, a: `${a.pd.plan.name} is listed at ${pa} and ${b.pd.plan.name} at ${pb}.${tail}`, sources: [ra.source_url as string, rb.source_url as string] });
  }
  const qa = a.pd.quotas.find((q) => q.source_url);
  const qb = b.pd.quotas.find((q) => q.source_url);
  if (qa && qb) {
    const sameVendor = a.v.vendor.id === b.v.vendor.id;
    out.push({
      q: `Can I compare ${a.pd.plan.name} and ${b.pd.plan.name} usage per dollar?`,
      a: sameVendor
        ? `Only where both plans publish the same unit over the same window, or a multiple of the same named base plan. Where that holds, the value-per-dollar section on this page shows it with its formula. Otherwise we show "not comparable".`
        : "Not across vendors. The two vendors use different official allowance units and base plans, and we do not convert one into the other, so we do not calculate a cross-vendor value-per-dollar figure.",
      sources: uniq([qa.source_url as string, qb.source_url as string]),
    });
  }
  return out;
}

export const sourceLinks = (item: FaqItem) => item.sources.map((url) => ({ url, domain: domainOf(url) }));
