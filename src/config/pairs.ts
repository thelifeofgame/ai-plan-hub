// First-batch vs pages (m1-pseo.md section 1.1: 13 plan pairs, P1). The listed direction is canonical;
// the swapped slug 301-redirects to it (next.config.ts). No 3-way pages. A pair renders only while both
// plans are verified (src/lib/pages.ts); otherwise the URL is not generated.
// Slug form: {vendor_slug}-{plan_slug}-vs-{vendor_slug}-{plan_slug}. Vendor and plan slugs come from the database.
export interface Side {
  vendor: string;
  plan: string;
}
export interface Pair {
  left: Side;
  right: Side;
}

const p = (lv: string, lp: string, rv: string, rp: string): Pair => ({ left: { vendor: lv, plan: lp }, right: { vendor: rv, plan: rp } });

export const VS_PAIRS: Pair[] = [
  // Cross-vendor (keywords.md cluster A)
  p("chatgpt", "plus", "claude", "pro"),
  p("chatgpt", "plus", "gemini", "ai-pro"),
  p("chatgpt", "pro-100", "claude", "max"),
  p("chatgpt", "pro-200", "claude", "ultra"),
  p("chatgpt", "pro-100", "gemini", "ai-ultra-5x"),
  p("grok", "super", "chatgpt", "plus"),
  // Same-vendor upgrades (cluster D)
  p("chatgpt", "plus", "chatgpt", "pro-100"),
  p("claude", "pro", "claude", "max"),
  p("claude", "max", "claude", "ultra"),
  p("gemini", "ai-pro", "gemini", "ai-ultra-5x"),
  p("gemini", "ai-pro", "gemini", "ai-ultra-20x"),
  p("grok", "premium", "grok", "super"),
  p("grok", "super", "grok", "ultra"),
];

const key = (s: Side) => `${s.vendor}-${s.plan}`;
export const pairSlug = (x: Pair) => `${key(x.left)}-vs-${key(x.right)}`;
export const inverseSlug = (x: Pair) => `${key(x.right)}-vs-${key(x.left)}`;
export const pairBySlug = (slug: string) => VS_PAIRS.find((x) => pairSlug(x) === slug) ?? null;
