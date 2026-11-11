import type { Metadata } from "next";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { ChangelogList } from "@/components/ChangelogList";
import { JsonLd } from "@/components/JsonLd";
import { loadChangeLog } from "@/lib/load";
import { pageJsonLd, pageMetadata } from "@/lib/seo";

// Segment config must be a literal. Keep in sync with REVALIDATE_SECONDS in src/config/site.ts.
export const revalidate = 3600;

// Title, description and H1 are from ia.md section 3.9. TODO(SEO copy): intro paragraph below is a neutral placeholder.
const TITLE = "AI Plan and Limit Changes \u2014 Changelog";
const DESCRIPTION = "A dated log of AI plan, price, and usage-rule changes for ChatGPT, Claude, Gemini, and Grok. Each entry links to the official source and shows when we confirmed it.";

export async function generateMetadata(): Promise<Metadata> {
  const d = await loadChangeLog();
  // No thin pages: noindex while there are no verified entries (or the read failed); indexable once it has entries.
  return pageMetadata({ path: "/changelog", title: TITLE, description: DESCRIPTION, noindex: d.unavailable || d.entries.length === 0 });
}

export default async function ChangelogPage() {
  const d = await loadChangeLog();
  const crumbs = [
    { name: "Home", path: "/" },
    { name: "Changelog", path: "/changelog" },
  ];
  const newest = d.entries.map((e) => e.confirmed_at ?? e.detected_at).sort().pop() ?? null;
  return (
    <>
      <JsonLd
        data={pageJsonLd({
          path: "/changelog",
          name: "Changelog: AI plan and limit changes",
          description: DESCRIPTION,
          dateModified: newest,
          crumbs,
          items: d.entries.slice(0, 50).map((e) => ({ name: e.summary ?? `${e.vendorName} ${e.entity_type} change` })),
        })}
      />
      <Breadcrumbs crumbs={crumbs} />
      <h1>Changelog: AI plan and limit changes</h1>
      <p className="lead prose">
        Confirmed changes to plans, prices, and usage rules, newest first. Each entry links to the official source and shows the date we verified it. A change that has been detected but not yet
        confirmed is not listed here, and the old value stays live until it is confirmed.
      </p>
      {d.entries.length === 0 ? (
        <p className="empty" role="status">
          {d.unavailable ? "The changelog is temporarily unavailable." : "No confirmed changes yet. Entries appear here once a change has been checked against the official source."}
        </p>
      ) : (
        <ChangelogList entries={d.entries} />
      )}
    </>
  );
}
