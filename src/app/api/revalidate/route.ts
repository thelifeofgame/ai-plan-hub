import { timingSafeEqual } from "node:crypto";
import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";

// POST /api/revalidate with header "x-revalidate-secret: <REVALIDATE_SECRET>". Regenerates all public pages.
export const dynamic = "force-dynamic";

function same(a: string, b: string) {
  const x = Buffer.from(a);
  const y = Buffer.from(b);
  return x.length === y.length && timingSafeEqual(x, y);
}

export async function POST(request: Request) {
  const secret = process.env.REVALIDATE_SECRET;
  if (!secret) return NextResponse.json({ ok: false, error: "not configured" }, { status: 503 });
  const given = request.headers.get("x-revalidate-secret") ?? "";
  if (!same(given, secret)) return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  // The root layout covers every page (home, compare, vendor pages, changelog and later routes).
  revalidatePath("/", "layout");
  // Metadata routes are not pages: refresh them explicitly.
  for (const f of ["sitemap.xml", "sitemap-core.xml", "sitemap-limits.xml", "sitemap-reset.xml", "sitemap-vs.xml", "sitemap-changelog.xml"]) revalidatePath(`/${f}`);
  revalidatePath("/robots.txt");
  return NextResponse.json({ ok: true, revalidatedAt: new Date().toISOString() });
}
