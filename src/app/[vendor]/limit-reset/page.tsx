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
import { domainOf, featureLabel, windowLabel } from "@/lib/format";
import { overageFaq, resetFaq, whereFaq } from "@/lib/faq";
import { formatDate, needsRecheck } from "@/lib/fresh";
import { loadSiteData } from "@/lib/load";
import { vendorHasQuotas, vendorNewestQuota, vendorNoindex } from "@/lib/pages";
import { pageJsonLd, pageMetadata } from "@/lib/seo";

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
  return v && vendorHasQuotas(v) ? v : null;
}

export async function generateMetadata({ params }: { params: Promise<{ vendor: string }> }): Promise<Metadata> {
  const { vendor: slug } = await params;
  const v = await find(slug);
  if (!v) return { title: "Not found", robots: { index: false, follow: false } };
  const name = v.vendor.name;
  return pageMetadata({
    path: `/${slug}/limit-reset`,
    title: `When Does the ${name} Usage Limit Reset?`,
    description: `How ${name} usage limits reset (session, weekly, and other windows) and where to see your next reset time in the product. Last verified ${formatDate(vendorNewestQuota(v))}. We do not publish a global reset clock.`,
    noindex: vendorNoindex(v),
  });
}

export default async function LimitResetPage({ params }: { params: Promise<{ vendor: string }> }) {
  const { vendor: slug } = await params;
  const v = await find(slug);
  if (!v) notFound();
  const name = v.vendor.name;
  const newest = vendorNewestQuota(v);
  const plans = v.plans.filter((p) => p.quotas.length > 0);
  const rows = plans.flatMap((p) => p.quotas.map((q) => ({ p, q })));
  const rules = rows.filter((r) => r.q.reset_rule);
  const where = Array.from(new Set(rows.map((r) => r.q.reset_visible_in).filter((w): w is string => !!w)));
  const withOverage = plans.filter((p) => p.plan.overage_options);
  const faq = [...resetFaq(v), ...whereFaq(v), ...withOverage.flatMap((p) => overageFaq(p))];
  const crumbs = [
    { name: "Home", path: "/" },
    { name, path: `/${slug}` },
    { name: "Limit reset", path: `/${slug}/limit-reset` },
  ];

  return (
    <>
      <JsonLd
        data={pageJsonLd({
          path: `/${slug}/limit-reset`,
          name: `When does the ${name} usage limit reset?`,
          description: `How ${name} usage limits reset and where to see your next reset time in the product.`,
          dateModified: newest,
          crumbs,
          items: plans.map((p) => ({ name: p.plan.name })),
          faq: faq.map((f) => ({ q: f.q, a: f.a })),
        })}
      />
      <Breadcrumbs crumbs={crumbs} />
      <h1>When does the {name} usage limit reset?</h1>

      <div className="prose">
        <p className="lead">Usage limits on {name} reset on a window- or account-assigned schedule.</p>
        {rules.length > 0 ? (
          <ul>
            {rules.map(({ p, q }) => (
              <li key={q.id}>
                <strong>
                  <Text>{p.plan.name}</Text>, {featureLabel(q)}:
                </strong>{" "}
                <Text>{q.reset_rule as string}</Text>
              </li>
            ))}
          </ul>
        ) : null}
        {where.length > 0 ? (
          <p>
            Check the next reset time in the product at{" "}
            {where.map((w, i) => (
              <span key={w}>
                {i > 0 ? "; " : ""}
                <Text>{w}</Text>
              </span>
            ))}
            .
          </p>
        ) : (
          <p>The official pages we checked do not publish a single in-product menu path for the next reset time. We do not invent one.</p>
        )}
      </div>
      <ReminderCta placement="limit-reset" />

      <h2>Reset rules by plan</h2>
      <div className="tablewrap">
        <table className="data">
          <caption className="sr">{name} reset rules by plan</caption>
          <thead>
            <tr>
              <th scope="col">Plan</th>
              <th scope="col">Feature</th>
              <th scope="col">Window</th>
              <th scope="col">Reset rule</th>
              <th scope="col">In-product location</th>
              <th scope="col">Last verified</th>
              <th scope="col">Source</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(({ p, q }) => (
              <tr key={q.id}>
                <th scope="row">
                  <Text>{p.plan.name}</Text>
                </th>
                <td>{featureLabel(q)}</td>
                <td>{windowLabel(q)}</td>
                <td className="small">{q.reset_rule ? <Text>{q.reset_rule}</Text> : "Not published"}</td>
                <td className="small">{q.reset_visible_in ? <Text>{q.reset_visible_in}</Text> : "Not published"}</td>
                <td>
                  <LastVerified iso={q.last_verified_at} recheck={needsRecheck(q.last_verified_at)} />
                </td>
                <td>{q.source_url ? <SourceLink url={q.source_url} domain={domainOf(q.source_url)} /> : "Not recorded"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {withOverage.length > 0 ? (
        <>
          <h2>If you hit a limit</h2>
          <ul className="prose">
            {withOverage.map((p) => (
              <li key={p.plan.slug}>
                <strong>
                  <Text>{p.plan.name}</Text>:
                </strong>{" "}
                <Text>{p.plan.overage_options as string}</Text>
              </li>
            ))}
          </ul>
        </>
      ) : null}

      <h2>Usage cap vs an outage</h2>
      <p className="prose">
        Hitting a usage cap is not the same as a service outage. Official status-page links are listed on <Link href="/status">/status</Link>. See also <Link href={`/${slug}`}>{name} plans</Link>.
      </p>

      <Faq items={faq} />

      <h2>Related</h2>
      <ul className="plain">
        <li>
          <Link href={`/${slug}/limits`}>{name} usage limits by plan</Link>
        </li>
        <li>
          <Link href={`/${slug}`}>{name} plans and prices</Link>
        </li>
        <li>
          <Link href="/compare">Compare all plans</Link>
        </li>
      </ul>
    </>
  );
}
