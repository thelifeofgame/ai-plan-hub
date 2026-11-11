import type { Metadata } from "next";
import Link from "next/link";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { JsonLd } from "@/components/JsonLd";
import { ReminderCta } from "@/components/ReminderCta";
import { SourceLink } from "@/components/SourceLink";
import { STATUS_LINKS, STATUS_LINKS_CHECKED_AT } from "@/config/status-links";
import { domainOf } from "@/lib/format";
import { pageJsonLd, pageMetadata } from "@/lib/seo";

// Fully static: no data fetch in M0. noindex until M1 (decision: project lead, 2026-11-11).
const DESCRIPTION = "Official status-page links for ChatGPT, Claude, Gemini, and Grok. In this first release we list the vendor pages; we do not invent outage reports.";

export function generateMetadata(): Metadata {
  return pageMetadata({ path: "/status", title: "AI Provider Status: Official Status Pages", description: DESCRIPTION, noindex: true });
}

export default function StatusPage() {
  const crumbs = [
    { name: "Home", path: "/" },
    { name: "Status", path: "/status" },
  ];
  return (
    <>
      <JsonLd
        data={pageJsonLd({
          path: "/status",
          name: "Official AI provider status pages",
          description: DESCRIPTION,
          dateModified: null,
          crumbs,
          items: STATUS_LINKS.map((s) => ({ name: `${s.vendorName} status page` })),
        })}
      />
      <Breadcrumbs crumbs={crumbs} />
      <h1>Official AI provider status pages</h1>
      <p className="lead prose">
        This page is a placeholder list of official status-page links. We do not show live status, uptime, or incident badges, and we do not invent outage reports. This page is not indexed in this
        release.
      </p>
      <p className="prose">
        For Gemini, the link is the Google Workspace Status Dashboard. We have not found an official status page for the consumer Gemini app.
      </p>
      <div className="tablewrap">
        <table className="data narrow">
          <caption className="sr">Official status pages</caption>
          <thead>
            <tr>
              <th scope="col">Vendor</th>
              <th scope="col">Official status page</th>
              <th scope="col">Note</th>
              <th scope="col">Last checked</th>
            </tr>
          </thead>
          <tbody>
            {STATUS_LINKS.map((s) => (
              <tr key={s.vendorSlug}>
                <th scope="row">{s.vendorName}</th>
                <td>
                  <SourceLink url={s.url} domain={domainOf(s.url)} />
                </td>
                <td>{s.note}</td>
                <td>
                  <time dateTime={STATUS_LINKS_CHECKED_AT}>{STATUS_LINKS_CHECKED_AT}</time>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="prose">
        Hitting a personal usage cap is not an outage. If you are not sure which one you are seeing, read the reset rules on the vendor page:{" "}
        {STATUS_LINKS.map((s, i) => (
          <span key={s.vendorSlug}>
            {i > 0 ? ", " : ""}
            <Link href={`/${s.vendorSlug}`}>{s.vendorName}</Link>
          </span>
        ))}
        .
      </p>
      <ReminderCta placement="status" />
    </>
  );
}
