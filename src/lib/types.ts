export interface Vendor {
  id: string;
  slug: string;
  name: string;
  company: string | null;
  website_url: string | null;
  pricing_url: string | null;
  status_page_url: string | null;
  display_order: number | null;
}

export interface Model {
  id: string;
  vendor_id: string;
  slug: string;
  name: string;
}

export interface Plan {
  id: string;
  vendor_id: string;
  slug: string;
  name: string;
  tier_order: number | null;
  audience: string | null;
  plan_status: string | null;
  overage_options: string | null;
  source_url: string | null;
  last_verified_at: string | null;
  verification_status: string;
}

export interface PlanPrice {
  id: string;
  plan_id: string;
  billing_period: "month" | "year";
  price_amount: number | null;
  currency: string;
  price_unit: "flat" | "per_user" | string;
  price_basis: string | null;
  price_notes: string | null;
  source_url: string | null;
  source_quote: string | null;
  last_verified_at: string | null;
  verification_status: string;
}

export interface PlanModel {
  plan_id: string;
  model_id: string;
  access_notes: string | null;
  source_url: string | null;
  source_quote: string | null;
  last_verified_at: string | null;
  verification_status: string;
}

export interface Quota {
  id: string;
  plan_id: string;
  model_id: string | null;
  feature: string;
  limit_value: number | null;
  limit_multiplier: number | null;
  multiplier_min: number | null;
  multiplier_max: number | null;
  multiplier_base_plan_slug: string | null;
  limit_min: number | null;
  limit_max: number | null;
  limit_unit: string;
  is_unlimited: boolean;
  is_published: boolean;
  window_type: string;
  window_hours: number | null;
  reset_rule: string | null;
  reset_visible_in: string | null;
  shared_pool_notes: string | null;
  rate_limit_notes: string | null;
  source_url: string | null;
  source_quote: string | null;
  last_verified_at: string | null;
  verification_status: string;
}

export type QuotaView = Quota & { model_name: string | null };

/** Everything the public pages need for one vendor, verified rows only. */
export interface VendorData {
  vendor: Vendor;
  plans: PlanData[];
}

export interface PlanData {
  plan: Plan;
  prices: PlanPrice[];
  models: { model: Model; link: PlanModel }[];
  quotas: QuotaView[];
  /** Oldest last_verified_at among the plan row and its public child rows. */
  oldestVerifiedAt: string | null;
  /** Newest last_verified_at among the same rows. */
  newestVerifiedAt: string | null;
  sources: string[];
}

export interface SiteData {
  vendors: VendorData[];
  /** True when env vars are missing or the read failed: pages render an empty state. */
  unavailable: boolean;
}

/** One public (verified) change_log row. entity_ref exists after migration 0005; null before. */
export interface ChangeEntry {
  id: string;
  vendorSlug: string;
  vendorName: string;
  entity_type: string;
  entity_ref: string | null;
  change_type: string;
  field: string | null;
  old_value: string | null;
  new_value: string | null;
  summary: string | null;
  source_url: string | null;
  detected_at: string;
  effective_at: string | null;
  confirmed_at: string | null;
  confirmed_by: string | null;
}

export interface ChangeLogData {
  entries: ChangeEntry[];
  unavailable: boolean;
}
