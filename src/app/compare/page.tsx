import type { Metadata } from "next";
import Link from "next/link";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { CompareTable } from "@/components/CompareTable";
import { Empty } from "@/components/Empty";
import { JsonLd } from "@/components/JsonLd";
import { ReminderCta } from "@/components/ReminderCta";
import { ValueSection } from "@/components/ValueSection";
import { BENCHMARKS, BENCHMARK_LINKS_RETRIEVED_AT } from "@/config/benchmarks";
import { STALE_WARN_DAYS } from "@/config/site";
import { formatDate, vendorsAllStale } from "@/lib/fresh";
import { loadSiteData } from "@/lib/load";
import { pageJsonLd, pageMetadata, titleYear } from "@/lib/seo";
import { valueGroups } from "@/lib/value";
import { allPlanViews } from "@/lib/views";

// Segment config must be a literal. Keep in sync with REVALIDATE_SECONDS in src/config/site.ts.
export const revalidate = 3600;

// Copy below is the finalized M0-6 text from ia.md section 8. Do not edit it here; change ia.md and update this file.
const DESCRIPTION =
  "Compare ChatGPT, Claude, Gemini, and Grok plans by official price, published usage limits, and reset rules. Most allowances are official multipliers with different bases, so value is not comparable across vendors. We do not invent message counts.";

function newestOf(vendors: Awaited<ReturnType<typeof loadSiteData>>["vendors"]) {
  return vendors.flatMap((v) => v.plans.map((p) => p.newestVerifiedAt)).filter((x): x is string => !!x).sort().pop() ?? null;
}

export async function generateMetadata(): Promise<Metadata> {
  const d = await loadSiteData();
  const title = `Compare AI Plans: Prices, Usage Limits, and Reset Windows${titleYear(newestOf(d.vendors))}`;
  return pageMetadata({ path: "/compare", title, description: DESCRIPTION, noindex: d.vendors.length === 0 || vendorsAllStale(d.vendors) });
}

export default async function ComparePage() {
  const d = await loadSiteData();
  const rows = allPlanViews(d.vendors);
  const newest = newestOf(d.vendors);
  const crumbs = [
    { name: "Home", path: "/" },
    { name: "Compare", path: "/compare" },
  ];

  return (
    <>
      <JsonLd
        data={pageJsonLd({
          path: "/compare",
          name: "Compare AI plan prices, limits, and reset windows",
          description: DESCRIPTION,
          dateModified: newest,
          crumbs,
          items: d.vendors.map((v) => ({ name: v.vendor.name, path: `/${v.vendor.slug}` })),
        })}
      />
      <Breadcrumbs crumbs={crumbs} />
      <h1>Compare AI plan prices, limits, and reset windows</h1>

      <div className="prose">
        <p className="lead">
          {"If you pay for an AI plan, the hard part is not the list price. It is knowing how much usage you actually get, when that usage comes back, and whether a higher tier is worth the jump. This page compares current ChatGPT, Claude, Gemini, and Grok plans using the vendors' own pricing and help pages."}
        </p>
        <p>
          {"Every row shows a last-verified date and a link to the official source we used. When a vendor does not publish a message count, we write \"Not published\" instead of guessing. Most vendors describe a higher plan as a multiple of a lower one, and those bases are not the same from vendor to vendor, so we do not compare value across vendors. Model quality is not scored here; where we mention benchmarks, we only cite LMArena and Artificial Analysis and we link to them."}
        </p>

        <h2>How to read this table</h2>
        <p>
          {"Prices are official list prices in the currency shown on each row, usually USD, excluding tax, for the region noted on the row. Annual prices, when offered, are also listed and are not mixed into monthly ratios without a label."}
        </p>
        <p>
          {"Usage limits are the vendor's official wording. We do not convert a multiplier into a message count. Many plans use a five-hour window, a weekly cap, or both. Some describe a higher plan as a multiple of a named base plan (for example, 5\u00d7 that vendor's Pro plan, or 4\u00d7 that vendor's standard limits) without saying how large the base is. A multiple is not a message count, and a 5\u00d7 on one vendor is not a 5\u00d7 on another."}
        </p>
        <p>
          {"Reset rules are the official rules. Limits reset on a window- or account-assigned schedule. Where the vendor tells us the in-product screen to open, we list it in the table. We do not publish a global weekday or clock time. You can also open the "}
          <Link href="/status">official status pages</Link>
          {" if you are trying to tell a usage cap from an outage."}
        </p>
        <p>{`If a row's last-verified date is more than seven days old, we mark it "Pending re-check." We do not hide that row for that reason alone.`}</p>
      </div>

      <h2>Plans compared</h2>
      {rows.length === 0 ? <Empty /> : <CompareTable rows={rows} />}

      <div className="prose">
        <h2>How we calculate value per dollar</h2>
        <p>
          {"Most allowances in this table are official multipliers, and each vendor uses a different base plan. Cross-vendor value is not comparable. We never convert one vendor's units into another vendor's units, and we never invent a shared \"messages per dollar\" index."}
        </p>
        <p>{"We only calculate a \"units per dollar\" figure inside a single vendor, when the arithmetic is checkable from official data, and we show it in that vendor's group, labeled with that vendor's unit or base."}</p>
        <p>{"If two plans from the same vendor publish the same unit over the same window, we use:"}</p>
        <p>
          <strong>{"included allowance units \u00f7 official monthly price in USD"}</strong>
        </p>
        <p>{"If that vendor only publishes a multiplier of a named base plan, we use a vendor-internal index:"}</p>
        <p>
          <strong>{"official multiplier \u00f7 official monthly price in USD"}</strong>
        </p>
        <p>
          {"If the unit, the base plan, or the vendor differs, we show \"Not comparable \u2014 different units\" or \"Not comparable \u2014 different bases\" and no number. We do not turn an unpublished base size into a made-up message count. We do not turn a published min\u2013max range into a single mid-point. We do not rank free plans by dividing by zero. Credits, paid resets, shared pools across chat and coding, regional pricing, and abuse guardrails are not in the ratio \u2014 they are noted in the table when official."}
        </p>
        <p>{"This formula measures published quantity per dollar inside one vendor. It is not output quality, and it is not a cross-vendor ranking."}</p>
      </div>

      {d.vendors.map((v) => (
        <section key={v.vendor.slug}>
          <h3>
            {v.vendor.name}: value per dollar (this vendor only)
          </h3>
          <ValueSection vendorName={v.vendor.name} groups={valueGroups(v)} />
        </section>
      ))}

      <div className="prose">
        <h2>Model quality is not our score</h2>
        <p>
          {"We do not rank models ourselves. If you want an independent view of model quality or speed, use "}
          <a href={BENCHMARKS[0].url} target="_blank" rel="noopener noreferrer">
            {BENCHMARKS[0].name}
          </a>
          {" and "}
          <a href={BENCHMARKS[1].url} target="_blank" rel="noopener noreferrer">
            {BENCHMARKS[1].name}
          </a>
          {`. Those are third-party benchmarks; they are not this site, and they are not part of the price-per-unit formula above. We retrieved the links on ${BENCHMARK_LINKS_RETRIEVED_AT}.`}
        </p>

        <h2>When limits reset</h2>
        <p>
          {"Reset windows differ by vendor and sometimes by feature. Read the reset column in the table, then the matching vendor page ("}
          {d.vendors.map((v, i) => (
            <span key={v.vendor.slug}>
              {i > 0 ? ", " : ""}
              <Link href={`/${v.vendor.slug}`}>{v.vendor.name}</Link>
            </span>
          ))}
          {") for the official rule and, when we have it, the in-product screen that shows your next reset time."}
        </p>
        <p>
          {"If today's problem is not a cap but an outage, start with the "}
          <Link href="/status">official status pages</Link>
          {". We list those vendor pages here; we do not invent a live outage badge in this first release."}
        </p>
      </div>

      <ReminderCta placement="compare" />

      <div className="prose">
        <p>{"This site is independent. Product names are trademarks of their owners and are used only to identify the plans we compare. Plan details change. If a vendor page and this table disagree, trust the vendor page and treat our row as pending a re-check."}</p>
        <p>
          {`Each row shows its own last-verified date (newest on this page: ${formatDate(newest)}). A pending re-check label means that date is older than ${STALE_WARN_DAYS} days (default 7).`}
        </p>
      </div>
    </>
  );
}
