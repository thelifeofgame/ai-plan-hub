import { createClient } from "@supabase/supabase-js";
import type { ChangeEntry, ChangeLogData, Model, Plan, PlanData, PlanModel, PlanPrice, Quota, QuotaView, SiteData, Vendor, VendorData } from "./types";

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

/** Verified change_log rows only (RLS also enforces this), newest first. */
export async function getChangeLog(): Promise<ChangeLogData> {
  const sb = client();
  if (!sb) return { entries: [], unavailable: true };
  try {
    const [v, c] = await Promise.all([sb.from("vendors").select("id, slug, name"), sb.from("change_log").select("*").order("detected_at", { ascending: false })]);
    if (v.error || c.error) {
      console.error("Supabase change_log read failed", v.error?.message, c.error?.message);
      return { entries: [], unavailable: true };
    }
    const vendorById = new Map((v.data ?? []).map((x: { id: string; slug: string; name: string }) => [x.id, x]));
    const entries: ChangeEntry[] = verified(c.data as (Record<string, unknown> & { verification_status: string })[]).flatMap((r) => {
      const vendor = vendorById.get(r.vendor_id as string);
      if (!vendor) return [];
      return [
        {
          id: r.id as string,
          vendorSlug: vendor.slug,
          vendorName: vendor.name,
          entity_type: r.entity_type as string,
          entity_ref: (r.entity_ref as string | null | undefined) ?? null,
          change_type: r.change_type as string,
          field: (r.field as string | null) ?? null,
          old_value: (r.old_value as string | null) ?? null,
          new_value: (r.new_value as string | null) ?? null,
          summary: (r.summary as string | null) ?? null,
          source_url: (r.source_url as string | null) ?? null,
          detected_at: r.detected_at as string,
          effective_at: (r.effective_at as string | null) ?? null,
          confirmed_at: (r.confirmed_at as string | null) ?? null,
          confirmed_by: (r.confirmed_by as string | null) ?? null,
        },
      ];
    });
    return { entries, unavailable: false };
  } catch (e) {
    console.error("Supabase change_log read threw", e);
    return { entries: [], unavailable: true };
  }
}
