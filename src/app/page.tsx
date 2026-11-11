import type { Metadata } from "next";
import Link from "next/link";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { Empty } from "@/components/Empty";
import { JsonLd } from "@/components/JsonLd";
import { LastVerified } from "@/components/LastVerified";
import { ReminderCta } from "@/components/ReminderCta";
import { Text } from "@/components/Text";
import { BENCHMARKS, BENCHMARK_LINKS_RETRIEVED_AT } from "@/config/benchmarks";
import { SITE_NAME } from "@/config/site";
import { needsRecheck, vendorsAllStale } from "@/lib/fresh";
import { loadSiteData } from "@/lib/load";
import { pageJsonLd, pageMetadata } from "@/lib/seo";
import { allPlanViews, homeHasEnoughData } from "@/lib/views";

// Segment config must be a literal. Keep in sync with REVALIDATE_SECONDS in src/config/site.ts.
export const revalidate = 3600;

const DESCRIPTION =
  "See published prices, usage limits, and reset rules for ChatGPT, Claude, Gemini, and Grok \u2014 verified against official pages. Compare plans and open each vendor's official status page. We do not invent message counts.";

async function noindex() {
  const d = await loadSiteData();
  return !homeHasEnoughData(d.vendors) || vendorsAllStale(d.vendors);
}

export async function generateMetadata(): Promise<Metadata> {
  return pageMetadata({ path: "/", title: `${SITE_NAME}: AI Plan Limits, Reset Times, and Status`, description: DESCRIPTION, noindex: await noindex() });
}

export default async function Home() {
  const d = await loadSiteData();
  const plans = allPlanViews(d.vendors);
  const newest = d.vendors.flatMap((v) => v.plans.map((p) => p.newestVerifiedAt)).filter((x): x is string => !!x).sort().pop() ?? null;
  const crumbs = [{ name: "Home", path: "/" }];

  return (
    <>
      <JsonLd
        data={pageJsonLd({
          path: "/",
          name: `${SITE_NAME}: AI Plan Limits, Reset Times, and Status`,
          description: DESCRIPTION,
          dateModified: newest,
          crumbs,
          items: d.vendors.map((v) => ({ name: v.vendor.name, path: `/${v.vendor.slug}` })),
        })}
      />
      <Breadcrumbs crumbs={crumbs} />
      <h1>Know your AI plan limits &mdash; and when they reset</h1>
      <p className="lead prose">
        {SITE_NAME} lists official prices, published usage limits, and reset rules for current ChatGPT, Claude, Gemini, and Grok plans. Every row links to the official source we used and shows its
        last-verified date. Unverified rows are not shown. We do not invent message counts or a global reset time, and we do not treat one vendor&apos;s allowance as comparable to another&apos;s. To
        tell a usage cap from an outage, start with each vendor&apos;s official status-page link.
      </p>

      {d.vendors.length === 0 ? (
        <Empty />
      ) : (
        <>
          <h2>Last verified</h2>
          <ul className="plain">
            {d.vendors.map((v) => {
              const latest = v.plans.map((p) => p.newestVerifiedAt).filter((x): x is string => !!x).sort().pop() ?? null;
              return (
                <li key={v.vendor.slug}>
                  <Link href={`/${v.vendor.slug}`}>{v.vendor.name}</Link>: <LastVerified iso={latest} recheck={needsRecheck(latest)} />
                </li>
              );
            })}
          </ul>

          <h2>Plan snapshot</h2>
          <div className="tablewrap">
            <table className="data narrow">
              <caption className="sr">Snapshot of verified plans</caption>
              <thead>
                <tr>
                  <th scope="col">Plan</th>
                  <th scope="col">Price</th>
                  <th scope="col">Usage (official wording)</th>
                  <th scope="col">Last verified</th>
                </tr>
              </thead>
              <tbody>
                {plans.map((p) => (
                  <tr key={`${p.vendorSlug}/${p.planSlug}`}>
                    <th scope="row">
                      <Link href={`/${p.vendorSlug}`}>{p.planName}</Link>
                    </th>
                    <td>{p.monthly ?? "Not published"}</td>
                    <td className="small">
                      {p.limits.length === 0 ? (
                        "Not published"
                      ) : (
                        <>
                          {p.limits[0].label}: {p.limits[0].limit}
                          {p.limits.length > 1 ? ` (+${p.limits.length - 1} more)` : ""}
                          {p.limits[0].resetRule ? (
                            <>
                              {" "}
                              &middot; <Text>{p.limits[0].resetRule}</Text>
                            </>
                          ) : null}
                        </>
                      )}
                    </td>
                    <td>
                      <LastVerified iso={p.lastVerified} recheck={p.recheck} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p>
            <Link href="/compare">See the full comparison</Link>
          </p>
        </>
      )}

      <h2>Where to go next</h2>
      <ul className="cards">
        <li>
          <h3>
            <Link href="/compare">Compare plans</Link>
          </h3>
          <p>Prices, included models, usage limits, and reset rules side by side.</p>
        </li>
        {d.vendors.map((v) => (
          <li key={v.vendor.slug}>
            <h3>
              <Link href={`/${v.vendor.slug}`}>{v.vendor.name} limits and reset rules</Link>
            </h3>
            <p>All verified {v.vendor.name} plans with sources.</p>
          </li>
        ))}
        <li>
          <h3>
            <Link href="/status">Official status pages</Link>
          </h3>
          <p>Links to each vendor&apos;s own status page.</p>
        </li>
      </ul>

      <ReminderCta placement="home" />

      <h2>Model quality is not our score</h2>
      <p className="prose">
        For an independent view of model quality, see{" "}
        {BENCHMARKS.map((b, i) => (
          <span key={b.name}>
            {i > 0 ? " and " : ""}
            <a href={b.url} target="_blank" rel="noopener noreferrer">
              {b.name}
            </a>
          </span>
        ))}
        . These are third-party benchmarks, not this site. Links retrieved {BENCHMARK_LINKS_RETRIEVED_AT}.
      </p>
    </>
  );
}
