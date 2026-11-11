import type { Metadata } from "next";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { ChangelogList } from "@/components/ChangelogList";
import { JsonLd } from "@/components/JsonLd";
import { SITE_NAME } from "@/config/site";
import { loadChangeLog } from "@/lib/load";
import { pageJsonLd, pageMetadata } from "@/lib/seo";

// Segment config must be a literal. Keep in sync with REVALIDATE_SECONDS in src/config/site.ts.
export const revalidate = 3600;

// Copy is from copy-m1.md (SEO), word for word.
const TITLE = `AI Plan Changelog: Price, Limit, and Reset Rule Changes | ${SITE_NAME}`;
const DESCRIPTION = "A dated, source-linked log of changes to ChatGPT, Claude, Grok, and Gemini plans, covering prices, included models, usage limits, and reset rules.";
const H1 = "AI plan changelog";
const INTRO =
  "A dated log of confirmed changes to ChatGPT, Claude, Grok, and Gemini subscription plans: prices, included models, usage limits, and reset rules. Each entry links to the official source and shows when we verified it. Changes we have detected but not yet confirmed are not listed.";
const EMPTY = "No confirmed changes yet. Entries appear here once a change has been verified against the official source.";

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
          name: H1,
          description: DESCRIPTION,
          dateModified: newest,
          crumbs,
          items: d.entries.slice(0, 50).map((e) => ({ name: e.summary ?? `${e.vendorName} ${e.entity_type} change` })),
        })}
      />
      <Breadcrumbs crumbs={crumbs} />
      <h1>{H1}</h1>
      <p className="lead prose">{INTRO}</p>
      {d.entries.length === 0 ? (
        <p className="empty" role="status">
          {d.unavailable ? "The changelog is temporarily unavailable." : EMPTY}
        </p>
      ) : (
        <ChangelogList entries={d.entries} />
      )}
    </>
  );
}
