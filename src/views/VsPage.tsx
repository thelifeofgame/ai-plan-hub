import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { Faq } from "@/components/Faq";
import { JsonLd } from "@/components/JsonLd";
import { LastVerified } from "@/components/LastVerified";
import { LimitsCell, ModelsCell, NotesCell, PriceCell, ResetCell, SourcesCell } from "@/components/PlanCells";
import { ReminderCta } from "@/components/ReminderCta";
import { Text } from "@/components/Text";
import { ValueSection } from "@/components/ValueSection";
import { BENCHMARKS, BENCHMARK_LINKS_RETRIEVED_AT } from "@/config/benchmarks";
import { pairBySlug } from "@/config/pairs";
import { SITE_NAME } from "@/config/site";
import { vsFaq } from "@/lib/faq";
import { formatDate } from "@/lib/fresh";
import { loadSiteData } from "@/lib/load";
import { eligiblePairs, pairLabel, pairNewest, pairNoindex, relatedPairs, resolvePair, vendorHasQuotas } from "@/lib/pages";
import { pageJsonLd, pageMetadata, titleYear } from "@/lib/seo";
import { valueGroups, type ValueGroup } from "@/lib/value";
import { planView } from "@/lib/views";

// Copy follows m1-pseo.md section 3 (Template A). Template placeholders are filled from the data.
async function resolve(slug: string) {
  const pair = pairBySlug(slug);
  if (!pair) return null;
  const d = await loadSiteData();
  const r = resolvePair(d, pair);
  return r ? { d, r } : null;
}

export async function vsMetadata(slug: string): Promise<Metadata> {
  const x = await resolve(slug);
  if (!x) return { title: "Not found", robots: { index: false, follow: false } };
  const { r } = x;
  const newest = pairNewest(r);
  return pageMetadata({
    path: `/${slug}`,
    title: `${pairLabel(r)}: Price, Limits, and Reset Windows${titleYear(newest)}`,
    description: `${pairLabel(r)} \u2014 official prices, published usage limits, and reset rules, last verified ${formatDate(newest)}. Value is compared only when both plans share the same vendor and the same unit or base. We do not invent message counts.`,
    noindex: pairNoindex(r),
  });
}

export async function VsPage({ slug }: { slug: string }) {
  const x = await resolve(slug);
  if (!x) notFound();
  const { d, r } = x;
  const a = { v: r.leftVendor, pd: r.left, view: planView(r.leftVendor, r.left) };
  const b = { v: r.rightVendor, pd: r.right, view: planView(r.rightVendor, r.right) };
  const label = pairLabel(r);
  const newest = pairNewest(r);
  const sameVendor = r.leftVendor.vendor.id === r.rightVendor.vendor.id;
  const crumbs = [
    { name: "Home", path: "/" },
    { name: "Compare", path: "/compare" },
    { name: label, path: `/${slug}` },
  ];
  const faq = vsFaq(a, b);
  const related = relatedPairs(eligiblePairs(d), r);

  // Same-vendor only: keep just the groups (and rows) of these two plans, and only if both have a computed number.
  let groups: ValueGroup[] = [];
  if (sameVendor) {
    const want = new Set([a.pd.plan.slug, b.pd.plan.slug]);
    groups = valueGroups(r.leftVendor)
      .map((g) => ({ ...g, rows: g.rows.filter((row) => want.has(row.planSlug)) }))
      .filter((g) => g.rows.filter((row) => row.perUsd !== null).length === 2);
  }

  const views = [a.view, b.view];
  return (
    <>
      <JsonLd
        data={pageJsonLd({
          path: `/${slug}`,
          name: label,
          description: `${label}: official prices, published usage limits, and reset rules.`,
          dateModified: newest,
          crumbs,
          items: views.map((v) => ({ name: v.planName })),
          faq: faq.map((f) => ({ q: f.q, a: f.a })),
        })}
      />
      <Breadcrumbs crumbs={crumbs} />
      <h1>{label}</h1>
      <p className="lead prose">
        {a.pd.plan.name} and {b.pd.plan.name} are compared using each vendor&apos;s official pricing and help pages. Prices can be compared when both sides have a published amount in the same
        currency and billing period. Usage allowances can be compared only when they share the same vendor and the same unit or the same base plan. Different vendors use different bases; we do not
        convert one into the other. When a vendor has not published a number, we write &quot;not published.&quot;
      </p>

      <h2>Side-by-side</h2>
      <div className="tablewrap">
        <table className="data narrow">
          <caption className="sr">{label}: side-by-side</caption>
          <thead>
            <tr>
              <th scope="col"></th>
              {views.map((v) => (
                <th scope="col" key={v.planSlug}>
                  <Link href={`/${v.vendorSlug}#${v.planSlug}`}>
                    <Text>{v.planName}</Text>
                  </Link>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            <tr>
              <th scope="row">Plan status and audience</th>
              {views.map((v) => (
                <td key={v.planSlug}>
                  {v.planStatus ?? "Not published"}
                  {v.audience ? `, ${v.audience}` : ""}
                </td>
              ))}
            </tr>
            <tr>
              <th scope="row">Price</th>
              {views.map((v) => (
                <td key={v.planSlug}>
                  <PriceCell p={v} />
                </td>
              ))}
            </tr>
            <tr>
              <th scope="row">Included models</th>
              {views.map((v) => (
                <td key={v.planSlug}>
                  <ModelsCell p={v} />
                </td>
              ))}
            </tr>
            <tr>
              <th scope="row">Usage limits and window</th>
              {views.map((v) => (
                <td key={v.planSlug}>
                  <LimitsCell p={v} />
                </td>
              ))}
            </tr>
            <tr>
              <th scope="row">Reset rule and in-product location</th>
              {views.map((v) => (
                <td key={v.planSlug}>
                  <ResetCell p={v} />
                </td>
              ))}
            </tr>
            <tr>
              <th scope="row">Shared pools and overage</th>
              {views.map((v) => (
                <td key={v.planSlug}>
                  <NotesCell p={v} />
                </td>
              ))}
            </tr>
            <tr>
              <th scope="row">Last verified</th>
              {views.map((v) => (
                <td key={v.planSlug}>
                  <LastVerified iso={v.lastVerified} recheck={v.recheck} />
                </td>
              ))}
            </tr>
            <tr>
              <th scope="row">Sources</th>
              {views.map((v) => (
                <td key={v.planSlug}>
                  <SourcesCell p={v} />
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>

      <h2>Value per dollar</h2>
      {sameVendor ? (
        groups.length > 0 ? (
          <ValueSection vendorName={r.leftVendor.vendor.name} groups={groups} />
        ) : (
          <p className="prose">These two plans do not publish the same unit over the same window, or the figures are ranges or unpublished, so we show &quot;not comparable&quot; and no number.</p>
        )
      ) : (
        <p className="prose">These plans do not share an official allowance unit or a common base plan. We do not calculate a cross-vendor value-per-dollar figure.</p>
      )}

      <h2>When limits reset</h2>
      <div className="prose">
        <p>
          Limits reset on a window- or account-assigned schedule. The reset rule for each plan is in the side-by-side table above.
          {views.some((v) => v.limits.some((l) => l.resetIn))
            ? " Where the vendor shows the next reset time in the product, the location is listed in the table."
            : " The in-product location for the next reset time is not published."}{" "}
          We never publish a global weekday or clock time.
        </p>
        <p>
          Hitting a usage cap is not the same as a service outage. Official status-page links are listed on <Link href="/status">/status</Link>.
        </p>
      </div>
      <ReminderCta placement="vs" />

      <h2>Model quality is not our score</h2>
      <p className="prose">
        We do not rank models ourselves. For an independent view, see{" "}
        <a href={BENCHMARKS[0].url} target="_blank" rel="noopener noreferrer">
          {BENCHMARKS[0].name}
        </a>{" "}
        and{" "}
        <a href={BENCHMARKS[1].url} target="_blank" rel="noopener noreferrer">
          {BENCHMARKS[1].name}
        </a>
        . Those are third-party benchmarks, retrieved {BENCHMARK_LINKS_RETRIEVED_AT}. They are not part of any price-per-unit figure on this page.
      </p>

      <h2>Sources</h2>
      <ul className="plain">
        {views.map((v) => (
          <li key={v.planSlug}>
            <strong>
              <Text>{v.planName}</Text>
            </strong>
            : <SourcesCell p={v} /> Last verified <LastVerified iso={v.lastVerified} recheck={v.recheck} />
          </li>
        ))}
      </ul>
      <p className="prose">If a vendor page and this table disagree, trust the vendor page and treat our row as pending a re-check.</p>

      <Faq items={faq} />

      <h2>More on {SITE_NAME}</h2>
      <ul className="plain">
        <li>
          <Link href="/compare">Compare all plans</Link>
        </li>
        {[r.leftVendor, ...(sameVendor ? [] : [r.rightVendor])].map((v) => (
          <li key={v.vendor.slug}>
            <Link href={`/${v.vendor.slug}`}>{v.vendor.name} plans</Link>
            {vendorHasQuotas(v) ? (
              <>
                {" "}
                &middot; <Link href={`/${v.vendor.slug}/limits`}>{v.vendor.name} limits</Link> &middot; <Link href={`/${v.vendor.slug}/limit-reset`}>{v.vendor.name} limit reset</Link>
              </>
            ) : null}
          </li>
        ))}
        {related.map((x2) => (
          <li key={x2.slug}>
            <Link href={`/${x2.slug}`}>{pairLabel(x2)}</Link>
          </li>
        ))}
      </ul>
    </>
  );
}
