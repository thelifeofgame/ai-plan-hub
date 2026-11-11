// FAQ items are built only from verified fields that have a source URL. An empty field means no question
// (m1-pseo.md section 6). Every item carries the source it was built from, and FAQPage JSON-LD is emitted
// only for the items that exist, so the schema never contains an unsourced answer.
import { domainOf, featureLabel, limitLabel, monthlyPrice } from "./format";
import type { PlanData, QuotaView, VendorData } from "./types";

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
  return [{ q: `How much does ${pd.plan.name} cost?`, a: `${pd.plan.name} is listed ${price === "Free" ? "as Free" : `at ${price}`}.${row.price_notes ? ` ${sentence(row.price_notes)}` : ""}`, sources: [row.source_url as string] }];
}

/** "A", "A and B", "A, B, and C". */
const joinNames = (xs: string[]) => (xs.length <= 2 ? xs.join(" and ") : `${xs.slice(0, -1).join(", ")}, and ${xs[xs.length - 1]}`);
/** Official text is quoted as stored; add a full stop only when it has no closing punctuation, so entries do not run together. */
const sentence = (t: string) => (/[.!?]$/.test(t.trim()) ? t.trim() : `${t.trim()}.`);

/** One entry per distinct (feature, text); plans that share the same text for the same feature are merged under one label. */
function perPlanEntries(v: VendorData, pick: (q: QuotaView) => string | null): { text: string; sources: string[] }[] {
  const groups = new Map<string, { feature: string; text: string; plans: string[]; sources: string[] }>();
  for (const pd of v.plans) {
    for (const q of pd.quotas) {
      const t = pick(q);
      if (!t || !q.source_url) continue;
      const key = `${featureLabel(q)}|${t}`;
      const g = groups.get(key) ?? { feature: featureLabel(q), text: t, plans: [], sources: [] };
      if (!g.plans.includes(pd.plan.name)) g.plans.push(pd.plan.name);
      g.sources.push(q.source_url);
      groups.set(key, g);
    }
  }
  return Array.from(groups.values()).map((g) => ({ text: `${joinNames(g.plans)}, ${g.feature}: ${sentence(g.text)}`, sources: uniq(g.sources) }));
}

/** Every verified, sourced quota row of the plan. No truncation. `listAt` says where the full table is. */
export function limitsFaq(v: VendorData, pd: PlanData, listAt: "table above" | "limits page" = "table above"): FaqItem[] {
  const rows = pd.quotas.filter((q) => q.source_url);
  if (rows.length === 0) return [];
  const base = baseNameOf(v);
  const a = rows.map((q) => `${featureLabel(q)}: ${limitLabel(q, pd.plan.slug, base)}.${q.source_quote ? ` Official wording: "${q.source_quote}"` : ""}`).join(" ");
  const tail = listAt === "table above" ? " The complete list, including windows, is in the table above." : " The complete list, including windows, is on the limits page.";
  return [{ q: `What are the usage limits on ${pd.plan.name}?`, a: `${a}${tail}`, sources: uniq(rows.map((q) => q.source_url as string)) }];
}

/** Each distinct verified reset_rule, labelled with its plan(s) and feature, with only the sources of the rows it cites. */
export function resetFaq(v: VendorData): FaqItem[] {
  const e = perPlanEntries(v, (q) => q.reset_rule);
  if (e.length === 0) return [];
  return [
    {
      q: `When does the ${v.vendor.name} usage limit reset?`,
      a: `Usage limits on ${v.vendor.name} reset on a window- or account-assigned schedule. ${e.map((x) => x.text).join(" ")}`,
      sources: uniq(e.flatMap((x) => x.sources)),
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

/** Every distinct verified shared_pool_notes, labelled with its plan(s) and feature; never one row standing for the whole vendor. */
export function poolFaq(v: VendorData): FaqItem[] {
  const e = perPlanEntries(v, (q) => q.shared_pool_notes);
  if (e.length === 0) return [];
  return [{ q: `Do ${v.vendor.name} features share one usage pool?`, a: `Sharing varies by plan and feature. ${e.map((x) => x.text).join(" ")}`, sources: uniq(e.flatMap((x) => x.sources)) }];
}

export function modelsFaq(pd: PlanData): FaqItem[] {
  const rows = pd.models.filter((m) => m.link.source_url);
  if (rows.length === 0) return [];
  const items = rows.map((m) => (m.link.access_notes ? `${m.model.name} (${m.link.access_notes})` : m.model.name));
  return [{ q: `Which models are included with ${pd.plan.name}?`, a: `${pd.plan.name} includes ${items.join("; ")}.`, sources: uniq(rows.map((m) => m.link.source_url as string)) }];
}

export function vsFaq(a: { v: VendorData; pd: PlanData }, b: { v: VendorData; pd: PlanData }): FaqItem[] {
  const out: FaqItem[] = [];
  const ra = a.pd.prices.find((p) => p.billing_period === "month" && p.price_amount !== null && p.source_url);
  const rb = b.pd.prices.find((p) => p.billing_period === "month" && p.price_amount !== null && p.source_url);
  if (ra && rb) {
    const pa = monthlyPrice([ra]);
    const pb = monthlyPrice([rb]);
    // Compare only when currency and price unit match; amounts are compared in that same currency (no USD conversion).
    const same = ra.currency === rb.currency && ra.price_unit === rb.price_unit;
    const x = ra.price_amount as number;
    const y = rb.price_amount as number;
    const tail = !same
      ? " The prices use different currencies or price units, so we do not name a cheaper plan."
      : x === y
        ? " The two official monthly list prices are equal."
        : ` On the official monthly list price, ${x < y ? a.pd.plan.name : b.pd.plan.name} is lower. This is a list-price comparison only and does not include tax or other fees.`;
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
