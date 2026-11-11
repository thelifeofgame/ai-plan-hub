import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { Faq } from "@/components/Faq";
import { JsonLd } from "@/components/JsonLd";
import { LastVerified } from "@/components/LastVerified";
import { ReminderCta } from "@/components/ReminderCta";
import { SourceLink } from "@/components/SourceLink";
import { Text } from "@/components/Text";
import { domainOf, featureLabel, limitLabel, windowLabel } from "@/lib/format";
import { costFaq, limitsFaq, modelsFaq, overageFaq, poolFaq, resetFaq, whereFaq } from "@/lib/faq";
import { formatDate, needsRecheck } from "@/lib/fresh";
import { loadSiteData } from "@/lib/load";
import { eligiblePairs, pairLabel, pairsForVendor, vendorHasQuotas, vendorNewestQuota, vendorNoindex } from "@/lib/pages";
import { pageJsonLd, pageMetadata, titleYear } from "@/lib/seo";

// Segment config must be a literal. Keep in sync with REVALIDATE_SECONDS in src/config/site.ts.
export const revalidate = 3600;
export const dynamicParams = true;

export async function generateStaticParams() {
  const d = await loadSiteData();
  return d.vendors.filter(vendorHasQuotas).map((v) => ({ vendor: v.vendor.slug }));
}

async function find(slug: string) {
  const d = await loadSiteData();
  const v = d.vendors.find((x) => x.vendor.slug === slug);
  return v && vendorHasQuotas(v) ? { d, v } : null;
}

export async function generateMetadata({ params }: { params: Promise<{ vendor: string }> }): Promise<Metadata> {
  const { vendor: slug } = await params;
  const x = await find(slug);
  if (!x) return { title: "Not found", robots: { index: false, follow: false } };
  const name = x.v.vendor.name;
  const newest = vendorNewestQuota(x.v);
  return pageMetadata({
    path: `/${slug}/limits`,
    title: `${name} Usage Limits by Plan${titleYear(newest)}`,
    description: `${name} usage limits for each plan, in the vendor's published wording. Includes session, weekly, and feature windows, last verified ${formatDate(newest)}. Exact message counts are shown only when the vendor publishes them.`,
    noindex: vendorNoindex(x.v),
  });
}

export default async function LimitsPage({ params }: { params: Promise<{ vendor: string }> }) {
  const { vendor: slug } = await params;
  const x = await find(slug);
  if (!x) notFound();
  const { d, v } = x;
  const name = v.vendor.name;
  const newest = vendorNewestQuota(v);
  const plans = v.plans.filter((p) => p.quotas.length > 0);
  const baseName = (s: string) => v.plans.find((p) => p.plan.slug === s)?.plan.name ?? s;
  const faq = [...resetFaq(v), ...whereFaq(v), ...poolFaq(v), ...plans.flatMap((p) => [...costFaq(p), ...limitsFaq(v, p), ...modelsFaq(p), ...overageFaq(p)])];
  const pairs = pairsForVendor(eligiblePairs(d), slug).slice(0, 6);
  const crumbs = [
    { name: "Home", path: "/" },
    { name, path: `/${slug}` },
    { name: "Limits", path: `/${slug}/limits` },
  ];
  const hasNotes = plans.some((p) => p.quotas.some((q) => q.rate_limit_notes || q.shared_pool_notes));

  return (
    <>
      <JsonLd
        data={pageJsonLd({
          path: `/${slug}/limits`,
          name: `${name} usage limits by plan`,
          description: `${name} usage limits for each plan, in the vendor's published wording.`,
          dateModified: newest,
          crumbs,
          items: plans.map((p) => ({ name: p.plan.name })),
          faq: faq.map((f) => ({ q: f.q, a: f.a })),
        })}
      />
      <Breadcrumbs crumbs={crumbs} />
      <h1>{name} usage limits by plan</h1>
      <p className="lead prose">
        This page lists official usage limits for current {name} plans. The wording comes from {name}&apos;s own pricing or help pages. When the vendor has not published a number, we write
        &quot;not published.&quot; We do not convert {name} multipliers into another vendor&apos;s units. Each row links to its source and shows its last-verified date.
      </p>
      {v.vendor.pricing_url ? (
        <p className="small muted">
          Vendor pricing page: <SourceLink url={v.vendor.pricing_url} domain={domainOf(v.vendor.pricing_url)} /> (external)
        </p>
      ) : null}

      {hasNotes ? (
        <>
          <h2>How {name} describes limits</h2>
          <ul className="prose">
            {Array.from(
              new Set(plans.flatMap((p) => p.quotas.flatMap((q) => [q.shared_pool_notes, q.rate_limit_notes]).filter((n): n is string => !!n))),
            )
              .slice(0, 4)
              .map((n) => (
                <li key={n}>
                  <Text>{n}</Text>
                </li>
              ))}
          </ul>
        </>
      ) : null}

      <h2>Limits by plan</h2>
      {plans.map((p) => (
        <section key={p.plan.slug} id={p.plan.slug}>
          <h3>
            <Text>{p.plan.name}</Text>{" "}
            <span className="muted small">
              ({p.plan.plan_status ?? "status not published"}
              {p.plan.audience ? `, ${p.plan.audience}` : ""})
            </span>
          </h3>
          {p.plan.overage_options ? (
            <p className="small">
              <em>Over the limit:</em> <Text>{p.plan.overage_options}</Text>
            </p>
          ) : null}
          <div className="tablewrap">
            <table className="data narrow">
              <caption className="sr">{p.plan.name} limits</caption>
              <thead>
                <tr>
                  <th scope="col">Feature</th>
                  <th scope="col">Official wording</th>
                  <th scope="col">Amount</th>
                  <th scope="col">Window</th>
                  <th scope="col">Shared pool</th>
                  <th scope="col">Last verified</th>
                  <th scope="col">Source</th>
                </tr>
              </thead>
              <tbody>
                {p.quotas.map((q) => (
                  <tr key={q.id}>
                    <th scope="row">{featureLabel(q)}</th>
                    <td className="small">{q.source_quote ?? "Not published"}</td>
                    <td>{limitLabel(q, p.plan.slug, baseName)}</td>
                    <td>{windowLabel(q)}</td>
                    <td className="small">{q.shared_pool_notes ? <Text>{q.shared_pool_notes}</Text> : "\u2014"}</td>
                    <td>
                      <LastVerified iso={q.last_verified_at} recheck={needsRecheck(q.last_verified_at)} />
                    </td>
                    <td>{q.source_url ? <SourceLink url={q.source_url} domain={domainOf(q.source_url)} /> : "Not recorded"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ))}

      <h2>What &quot;not published&quot; means</h2>
      <p className="prose">
        If a cell says &quot;not published,&quot; the official page we checked does not give a specific number (or the figure is unverified and therefore omitted). We do not guess a message count from a
        multiplier or a range.
      </p>

      <h2>When these limits reset</h2>
      <p className="prose">
        Limits reset on a window- or account-assigned schedule; the rule for each row is on the <Link href={`/${slug}/limit-reset`}>{name} limit-reset page</Link>. Where the vendor shows the next reset time in
        the product, that page lists the location. We never publish a global weekday or clock time.
      </p>
      <ReminderCta placement="limits" />

      <Faq items={faq} />

      <h2>Related</h2>
      <ul className="plain">
        <li>
          <Link href={`/${slug}`}>{name} plans and prices</Link>
        </li>
        <li>
          <Link href={`/${slug}/limit-reset`}>When does the {name} usage limit reset?</Link>
        </li>
        <li>
          <Link href="/compare">Compare all plans</Link>
        </li>
        {pairs.map((x2) => (
          <li key={x2.slug}>
            <Link href={`/${x2.slug}`}>{pairLabel(x2)}</Link>
          </li>
        ))}
      </ul>
    </>
  );
}
