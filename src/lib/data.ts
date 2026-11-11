import { createClient } from "@supabase/supabase-js";
import type { Model, Plan, PlanData, PlanModel, PlanPrice, Quota, QuotaView, SiteData, Vendor, VendorData } from "./types";

// Read-only access with the public anon key. RLS already limits child tables to verified rows;
// we filter again below so an unverified row can never reach a page.
function client() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}

const verified = <T extends { verification_status: string }>(rows: T[] | null) =>
  (rows ?? []).filter((r) => r.verification_status === "verified");

function times(plan: Plan, prices: PlanPrice[], models: PlanModel[], quotas: Quota[]) {
  const all = [plan.last_verified_at, ...prices.map((p) => p.last_verified_at), ...models.map((m) => m.last_verified_at), ...quotas.map((q) => q.last_verified_at)]
    .filter((t): t is string => !!t)
    .sort();
  return { oldest: all[0] ?? null, newest: all[all.length - 1] ?? null };
}

export async function getSiteData(): Promise<SiteData> {
  const sb = client();
  if (!sb) return { vendors: [], unavailable: true };
  try {
    const [v, p, pp, m, pm, q] = await Promise.all([
      sb.from("vendors").select("*").order("display_order"),
      sb.from("plans").select("*").order("tier_order"),
      sb.from("plan_prices").select("*"),
      sb.from("models").select("*"),
      sb.from("plan_models").select("*"),
      sb.from("quotas").select("*"),
    ]);
    if (v.error || p.error || pp.error || m.error || pm.error || q.error) {
      console.error("Supabase read failed", v.error?.message, p.error?.message, pp.error?.message, m.error?.message, pm.error?.message, q.error?.message);
      return { vendors: [], unavailable: true };
    }
    const vendors = (v.data ?? []) as Vendor[];
    const plans = verified(p.data as Plan[]);
    const prices = verified(pp.data as PlanPrice[]);
    const models = (m.data ?? []) as Model[];
    const planModels = verified(pm.data as PlanModel[]);
    const quotas = verified(q.data as Quota[]);
    const modelById = new Map(models.map((x) => [x.id, x]));

    const out: VendorData[] = vendors.map((vendor) => {
      const planData: PlanData[] = plans
        .filter((pl) => pl.vendor_id === vendor.id)
        .sort((a, b) => (a.tier_order ?? 0) - (b.tier_order ?? 0))
        .map((plan) => {
          const myPrices = prices.filter((x) => x.plan_id === plan.id);
          const myLinks = planModels.filter((x) => x.plan_id === plan.id);
          const myQuotas: QuotaView[] = quotas
            .filter((x) => x.plan_id === plan.id)
            .map((x) => ({ ...x, model_name: x.model_id ? (modelById.get(x.model_id)?.name ?? null) : null }));
          const t = times(plan, myPrices, myLinks, myQuotas);
          const sources = Array.from(
            new Set([plan.source_url, ...myPrices.map((x) => x.source_url), ...myLinks.map((x) => x.source_url), ...myQuotas.map((x) => x.source_url)].filter((u): u is string => !!u)),
          );
          return {
            plan,
            prices: myPrices,
            models: myLinks.flatMap((link) => {
              const model = modelById.get(link.model_id);
              return model ? [{ model, link }] : [];
            }),
            quotas: myQuotas,
            oldestVerifiedAt: t.oldest,
            newestVerifiedAt: t.newest,
            sources,
          };
        });
      return { vendor, plans: planData };
    });
    return { vendors: out, unavailable: false };
  } catch (e) {
    console.error("Supabase read threw", e);
    return { vendors: [], unavailable: true };
  }
}
