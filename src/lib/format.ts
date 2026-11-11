import type { PlanPrice, QuotaView } from "./types";

const CJK = /[\u3400-\u9fff\uff00-\uffef]/;
/** True when a stored text is not English (the data editor currently writes many notes in Chinese). */
export const isCjk = (s: string) => CJK.test(s);

export function domainOf(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

function money(amount: number, currency: string): string {
  const n = Number.isInteger(amount) ? String(amount) : amount.toFixed(2);
  return currency === "USD" ? `$${n}` : `${n} ${currency}`;
}

export function monthlyPrice(prices: PlanPrice[]): string | null {
  const p = prices.find((x) => x.billing_period === "month");
  if (!p) return null;
  if (p.price_amount === null) return "Not published";
  if (p.price_amount === 0) return "Free";
  return `${money(p.price_amount, p.currency)} / ${p.price_unit === "per_user" ? "user / month" : "month"}`;
}

export function annualPrice(prices: PlanPrice[]): string | null {
  const p = prices.find((x) => x.billing_period === "year");
  if (!p || p.price_amount === null) return null;
  if (p.price_basis === "per_month") return `${money(p.price_amount, p.currency)} / ${p.price_unit === "per_user" ? "user / month" : "month"}, billed annually`;
  if (p.price_basis === "per_year_total") return `${money(p.price_amount, p.currency)} / ${p.price_unit === "per_user" ? "user / year" : "year"}, billed annually`;
  return `${money(p.price_amount, p.currency)} billed annually`;
}

export function monthlyAmountUsd(prices: PlanPrice[]): number | null {
  const p = prices.find((x) => x.billing_period === "month" && x.currency === "USD");
  return p && p.price_amount !== null ? p.price_amount : null;
}

const num = (n: number) => (Number.isInteger(n) ? n.toLocaleString("en-US") : String(n));

export function featureLabel(q: QuotaView): string {
  const f = q.feature.replace(/_/g, " ");
  return q.model_name ? `${f} (${q.model_name})` : f;
}

export function windowLabel(q: Pick<QuotaView, "window_type" | "window_hours">): string {
  const h = q.window_hours;
  const hours = h === null ? "" : h === 168 ? "weekly, 168 h" : h === 720 ? "monthly, about 720 h" : h === 24 ? "daily, 24 h" : `${num(h)} h`;
  switch (q.window_type) {
    case "rolling":
      return hours ? `Rolling window (${hours})` : "Rolling window";
    case "fixed":
      return hours ? `Fixed reset window (${hours})` : "Fixed reset window";
    case "none":
      return "No usage window";
    default:
      return hours ? `Window type not published (${hours} listed)` : "Not published";
  }
}

export function limitLabel(q: QuotaView, planSlug: string, baseName: (slug: string) => string): string {
  if (q.is_unlimited) return "Unlimited as published (vendor safeguards apply)";
  if (q.limit_min !== null && q.limit_max !== null) return `${num(q.limit_min)}\u2013${num(q.limit_max)} ${q.limit_unit} (range as published)`;
  if (q.multiplier_min !== null && q.multiplier_max !== null) {
    const base = q.multiplier_base_plan_slug ? ` ${baseName(q.multiplier_base_plan_slug)}` : "";
    return `${num(q.multiplier_min)}\u2013${num(q.multiplier_max)}\u00d7${base} (range as published)`;
  }
  if (q.limit_value !== null) return `${num(q.limit_value)} ${q.limit_unit}`;
  if (q.limit_multiplier !== null) {
    if (q.limit_multiplier === 1 && q.multiplier_base_plan_slug === planSlug) return "Baseline (1\u00d7); base size not published";
    const base = q.multiplier_base_plan_slug ? baseName(q.multiplier_base_plan_slug) : "base plan";
    return `${num(q.limit_multiplier)}\u00d7 ${base}${q.is_published ? "" : " (base size not published)"}`;
  }
  return "Not published";
}
