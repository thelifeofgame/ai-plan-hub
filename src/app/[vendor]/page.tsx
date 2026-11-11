import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { JsonLd } from "@/components/JsonLd";
import { LimitsCell, ModelsCell, NotesCell, PriceCell, ResetCell, SourcesCell, VerifiedCell } from "@/components/PlanCells";
import { Text } from "@/components/Text";
import { ReminderCta } from "@/components/ReminderCta";
import { ValueSection } from "@/components/ValueSection";
import { BENCHMARKS, BENCHMARK_LINKS_RETRIEVED_AT } from "@/config/benchmarks";
import { STALE_WARN_DAYS } from "@/config/site";
import { allRowsStale, formatDate } from "@/lib/fresh";
import { pairBySlug } from "@/config/pairs";
import { eligiblePairs, pairLabel, pairsForVendor, vendorHasQuotas } from "@/lib/pages";
import { VsPage, vsMetadata } from "@/views/VsPage";
import { loadSiteData } from "@/lib/load";
import { pageJsonLd, pageMetadata, titleYear } from "@/lib/seo";
import { valueGroups } from "@/lib/value";
import { planView } from "@/lib/views";

// Segment config must be a literal. Keep in sync with REVALIDATE_SECONDS in src/config/site.ts.
export const revalidate = 3600;
// Slugs come from the database (vendors.slug). A vendor added later renders on first request, then is cached.
export const dynamicParams = true;

// One dynamic segment serves two page types: a vendor slug, or a configured vs-pair slug ("a-vs-b").
export async function generateStaticParams() {
  const d = await loadSiteData();
  return [...d.vendors.map((v) => ({ vendor: v.vendor.slug })), ...eligiblePairs(d).map((r) => ({ vendor: r.slug }))];
}

async function find(slug: string) {
  const d = await loadSiteData();
  return d.vendors.find((v) => v.vendor.slug === slug) ?? null;
}

const newestOf = (dates: (string | null)[]) => dates.filter((x): x is string => !!x).sort().pop() ?? null;

export async function generateMetadata({ params }: { params: Promise<{ vendor: string }> }): Promise<Metadata> {
  const { vendor: slug } = await params;
  if (pairBySlug(slug)) return vsMetadata(slug);
  const v = await find(slug);
  if (!v) return { title: "Not found", robots: { index: false, follow: false } };
  const newest = newestOf(v.plans.map((p) => p.newestVerifiedAt));
  const name = v.vendor.name;
  return pageMetadata({
    path: `/${slug}`,
    title: `${name} Plans, Prices, and Usage Limits${titleYear(newest)}`,
    description: `${name} plan prices, included models, official usage-limit wording, and reset rules \u2014 last verified ${formatDate(newest)}. Sources linked on every row. Rows older than seven days are marked pending re-check.`,
    noindex: v.plans.length === 0 || allRowsStale(v.plans.map((p) => p.newestVerifiedAt)),
  });
}

export default async function VendorPage({ params }: { params: Promise<{ vendor: string }> }) {
  const { vendor: slug } = await params;
  if (pairBySlug(slug)) return <VsPage slug={slug} />;
  const v = await find(slug);
  if (!v) notFound();
  const pairs = pairsForVendor(eligiblePairs(await loadSiteData()), slug);
  const views = v.plans.map((p) => planView(v, p));
  const newest = newestOf(v.plans.map((p) => p.newestVerifiedAt));
  const name = v.vendor.name;
  const crumbs = [
    { name: "Home", path: "/" },
    { name, path: `/${slug}` },
  ];
  const description = `${name} plan prices, included models, official usage-limit wording, and reset rules \u2014 last verified ${formatDate(newest)}.`;

  return (
    <>
      <JsonLd data={pageJsonLd({ path: `/${slug}`, name: `${name} plans, prices, and limits`, description, dateModified: newest, crumbs, items: views.map((p) => ({ name: p.planName })) })} />
      <Breadcrumbs crumbs={crumbs} />
      <h1>{name} plans, prices, and limits</h1>
      <p className="lead prose">
        These are the current {name} plans we have verified. Prices, included models, usage-limit wording, and reset rules come from official {name} pages. Each row links to its source and shows its
        last-verified date (most recent on this page: {formatDate(newest)}). Unverified rows are not shown. We quote the vendor&apos;s own wording and do not invent a message count. {name} allowances are
        not converted into another vendor&apos;s units.
      </p>
      <p>
        {v.vendor.company ? <span className="muted small">Operated by {v.vendor.company}. </span> : null}
        <Link href="/compare">Compare with other vendors</Link> &middot; <Link href="/status">Official status pages</Link>
        {vendorHasQuotas(v) ? (
          <>
            {" "}
            &middot; <Link href={`/${slug}/limits`}>Full limits</Link> &middot; <Link href={`/${slug}/limit-reset`}>When limits reset</Link>
          </>
        ) : null}
      </p>

      {views.length === 0 ? (
        <p className="empty" role="status">
          No verified {name} plan rows to show yet.
        </p>
      ) : (
        <>
          <h2>Plan table</h2>
          <div className="tablewrap">
            <table className="data">
              <caption className="sr">{name} plans: price, models, usage limits, reset rules, last verified, sources</caption>
              <thead>
                <tr>
                  <th scope="col">Plan</th>
                  <th scope="col">Price</th>
                  <th scope="col">Included models</th>
                  <th scope="col">Usage limits (official wording)</th>
                  <th scope="col">Reset rules</th>
                  <th scope="col">Shared pools and overage</th>
                  <th scope="col">Last verified</th>
                  <th scope="col">Sources</th>
                </tr>
              </thead>
              <tbody>
                {views.map((p) => (
                  <tr key={p.planSlug} id={p.planSlug}>
                    <th scope="row">
                      <strong>
                        <Text>{p.planName}</Text>
                      </strong>
                      <div className="muted small">
                        {p.planStatus ?? "status not recorded"}
                        {p.audience ? `, ${p.audience}` : ""}
                      </div>
                    </th>
                    <td>
                      <PriceCell p={p} />
                    </td>
                    <td>
                      <ModelsCell p={p} />
                    </td>
                    <td>
                      <LimitsCell p={p} />
                    </td>
                    <td>
                      <ResetCell p={p} />
                    </td>
                    <td>
                      <NotesCell p={p} />
                    </td>
                    <td>
                      <VerifiedCell p={p} />
                    </td>
                    <td>
                      <SourcesCell p={p} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="muted small">A &quot;Pending re-check&quot; label means a row&apos;s last-verified date is older than {STALE_WARN_DAYS} days. The row stays visible.</p>

          <h2>When {name} limits reset</h2>
          {/* Standard reset wording from ia.md section 3; no global weekday or clock. */}
          <p className="prose">
            Usage resets on a window- or account-assigned schedule. The next reset time is the one the product shows. Where we have the in-product location, it is listed in the reset column above;
            when it is not listed, we have not verified where the product shows it, and we do not guess a menu path. We never publish a global weekday or clock time.
          </p>
          <ReminderCta placement="vendor" />

          <h2>{name} value per dollar (this vendor only)</h2>
          <p className="prose small muted">
            Computed only between {name} plans, for the same unit and the same window. A multiple of a named base plan is not a message count. Free plans, ranges and unpublished figures are excluded. See{" "}
            <Link href="/compare">how we calculate value per dollar</Link>.
          </p>
          <ValueSection vendorName={name} groups={valueGroups(v)} />
        </>
      )}

      {pairs.length > 0 ? (
        <>
          <h2>Compared with other plans</h2>
          <ul className="plain">
            {pairs.map((x) => (
              <li key={x.slug}>
                <Link href={`/${x.slug}`}>{pairLabel(x)}</Link>
              </li>
            ))}
          </ul>
        </>
      ) : null}

      <h2>Model quality is not our score</h2>
      <p className="prose">
        For an independent view, see{" "}
        <a href={BENCHMARKS[0].url} target="_blank" rel="noopener noreferrer">
          {BENCHMARKS[0].name}
        </a>{" "}
        and{" "}
        <a href={BENCHMARKS[1].url} target="_blank" rel="noopener noreferrer">
          {BENCHMARKS[1].name}
        </a>
        . Third-party benchmarks, links retrieved {BENCHMARK_LINKS_RETRIEVED_AT}.
      </p>
    </>
  );
}
