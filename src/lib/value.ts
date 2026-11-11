// Value per dollar, computed once at build time, in this single function set.
// Rules (ia.md 6, 10.3):
//  - only inside ONE vendor, same unit, same feature/model, same window, same price unit;
//  - multipliers convert by chain back to the 1x baseline, only if every row in the chain is verified
//    (all rows we load are verified) and the feature and window match;
//  - range-only data (limit_min/max, multiplier_min/max) is never turned into a number;
//  - free plans (price 0) and unpublished prices are excluded;
//  - no cross-vendor numbers, ever.
import { monthlyAmountUsd, windowLabel } from "./format";
import type { PlanData, QuotaView, VendorData } from "./types";

export interface ValueRow {
  planName: string;
  planSlug: string;
  /** What was divided: e.g. "20x" or "15 messages". */
  quantity: string | null;
  price: string | null;
  /** Number per USD, or null when not computed. */
  perUsd: number | null;
  /** Why no number, or a plain label. */
  note: string | null;
  /** Formula for the footnote. */
  formula: string | null;
}

export interface ValueGroup {
  id: string;
  title: string;
  kind: "multiplier" | "absolute";
  /** Header for the number column, naming the unit/base. */
  unitLabel: string;
  rows: ValueRow[];
}

const isRange = (q: QuotaView) => q.limit_min !== null || q.limit_max !== null || q.multiplier_min !== null || q.multiplier_max !== null;

function sameScope(a: QuotaView, b: QuotaView) {
  return a.feature === b.feature && a.model_id === b.model_id && a.limit_unit === b.limit_unit && a.window_type === b.window_type && a.window_hours === b.window_hours;
}

interface Resolved {
  value: number;
  steps: { plan: string; mult: number }[];
}

/** Walk the multiplier chain to the 1x baseline. Returns null (with reason) when it cannot be proven. */
function resolve(plan: PlanData, q: QuotaView, plans: PlanData[], seen: Set<string> = new Set()): Resolved | string {
  if (isRange(q)) return "Range only: not converted";
  if (q.limit_multiplier === null) return "No multiplier published";
  if (!q.multiplier_base_plan_slug) return "No base plan named";
  if (seen.has(plan.plan.slug)) return "Not comparable: circular base";
  const next = new Set(seen).add(plan.plan.slug);
  if (q.multiplier_base_plan_slug === plan.plan.slug) {
    return q.limit_multiplier === 1 ? { value: 1, steps: [{ plan: plan.plan.slug, mult: 1 }] } : "Not comparable: bad baseline";
  }
  const basePlan = plans.find((p) => p.plan.slug === q.multiplier_base_plan_slug);
  if (!basePlan) return "Not comparable: base plan is not a verified public row";
  const baseQuota = basePlan.quotas.find((x) => sameScope(x, q) && x.limit_multiplier !== null);
  if (!baseQuota) return "Not comparable: different windows or bases";
  const r = resolve(basePlan, baseQuota, plans, next);
  if (typeof r === "string") return r;
  return { value: q.limit_multiplier * r.value, steps: [{ plan: plan.plan.slug, mult: q.limit_multiplier }, ...r.steps] };
}

function windowKey(q: QuotaView) {
  return `${q.window_type}:${q.window_hours ?? ""}`;
}

function usd(n: number) {
  return Number.isInteger(n) ? `$${n}` : `$${n.toFixed(2)}`;
}

function fmt(n: number) {
  if (Number.isInteger(n)) return String(n);
  return n >= 100 ? n.toFixed(1) : n >= 1 ? n.toFixed(2) : n.toPrecision(2);
}

export function valueGroups(v: VendorData): ValueGroup[] {
  const plans = v.plans;
  const name = (slug: string) => plans.find((p) => p.plan.slug === slug)?.plan.name ?? slug;
  // Group key: feature + model + unit + window + price unit. Nothing outside this vendor is ever mixed in.
  const groups = new Map<string, ValueGroup>();

  for (const pd of plans) {
    const priceUnit = pd.prices.find((p) => p.billing_period === "month")?.price_unit ?? "flat";
    const price = monthlyAmountUsd(pd.prices);
    for (const q of pd.quotas) {
      const hasNumber = q.limit_value !== null && !q.is_unlimited && q.is_published;
      const hasMult = q.limit_multiplier !== null || isRange(q);
      if (!hasNumber && !hasMult) continue;
      // No usage window (e.g. context window size) is a capacity, not an allowance over time: no per-dollar ratio.
      if (q.window_type === "none") continue;
      const kind: ValueGroup["kind"] = hasNumber && !isRange(q) ? "absolute" : "multiplier";
      const feature = q.feature.replace(/_/g, " ") + (q.model_name ? ` (${q.model_name})` : "");
      const key = [kind, q.feature, q.model_id ?? "", q.limit_unit, windowKey(q), priceUnit].join("|");
      let g = groups.get(key);
      if (!g) {
        g = {
          id: key,
          title: `${feature}, ${windowLabel(q).toLowerCase()}`,
          kind,
          unitLabel: kind === "absolute" ? `${q.limit_unit} per USD` : "index per USD (multiple of the base plan \u00f7 monthly USD price)",
          rows: [],
        };
        groups.set(key, g);
      }
      const row: ValueRow = { planName: pd.plan.name, planSlug: pd.plan.slug, quantity: null, price: price === null ? null : usd(price), perUsd: null, note: null, formula: null };
      if (isRange(q)) {
        row.quantity = kind === "absolute" ? "range" : "range";
        row.note = "Range only: shown on the plan table, not used in value per dollar";
      } else if (kind === "absolute") {
        row.quantity = `${q.limit_value} ${q.limit_unit}`;
        if (price === null) row.note = "Price not published";
        else if (price === 0) row.note = "Free plan: excluded";
        else {
          row.perUsd = (q.limit_value as number) / price;
          row.formula = `${pd.plan.name}: ${q.limit_value} \u00f7 ${usd(price)} = ${formatPerUsd(row.perUsd)} ${q.limit_unit} per USD`;
        }
      } else {
        const r = resolve(pd, q, plans);
        if (typeof r === "string") {
          row.note = r;
        } else {
          row.quantity = `${fmt(r.value)}\u00d7`;
          const chain = r.steps.map((s) => `${s.mult}`).join(" \u00d7 ");
          const via = r.steps.map((s) => name(s.plan)).join(" \u2192 ");
          const baselineName = name(r.steps[r.steps.length - 1].plan);
          if (price === null) row.note = "Price not published";
          else if (price === 0) row.note = "Free plan: excluded";
          else {
            row.perUsd = r.value / price;
            row.formula = `${pd.plan.name}: ${chain} = ${fmt(r.value)}\u00d7 ${baselineName} (chain: ${via}); ${fmt(r.value)} \u00f7 ${usd(price)} = ${formatPerUsd(row.perUsd)} per USD`;
          }
          if (r.steps.length === 1) row.quantity = "1\u00d7 (baseline)";
        }
      }
      g.rows.push(row);
    }
  }
  // A ratio only means something next to another ratio: keep groups with at least two computed rows.
  return Array.from(groups.values()).filter((g) => g.rows.filter((r) => r.perUsd !== null).length >= 2);
}

function formatPerUsd(n: number) {
  return n >= 100 ? n.toFixed(1) : n >= 1 ? n.toFixed(2) : n.toPrecision(2);
}

export { formatPerUsd as formatRatio };
