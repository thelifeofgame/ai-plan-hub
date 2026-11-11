"use client";

import { useState } from "react";
import Link from "next/link";
import { formatDate } from "@/lib/fresh";
import type { ChangeEntry } from "@/lib/types";
import { SourceLink } from "./SourceLink";
import { Text } from "./Text";

const domainOf = (url: string) => {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
};

/** Confirmed entries, newest first. The vendor filter only hides rows in the browser; no URL params. */
export function ChangelogList({ entries }: { entries: ChangeEntry[] }) {
  const [vendor, setVendor] = useState("all");
  const vendors = Array.from(new Map(entries.map((e) => [e.vendorSlug, e.vendorName])).entries());
  const shown = entries.filter((e) => vendor === "all" || e.vendorSlug === vendor);
  return (
    <div>
      {vendors.length > 1 ? (
        <div className="filters">
          <label>
            Vendor{" "}
            <select value={vendor} onChange={(e) => setVendor(e.target.value)}>
              <option value="all">All</option>
              {vendors.map(([slug, name]) => (
                <option key={slug} value={slug}>
                  {name}
                </option>
              ))}
            </select>
          </label>
          <span className="muted small" aria-live="polite">
            Showing {shown.length} of {entries.length} entries
          </span>
        </div>
      ) : null}
      <ol className="plain changelog">
        {shown.map((e) => (
          <li key={e.id}>
            <h3>
              <time dateTime={e.detected_at}>{formatDate(e.detected_at)}</time> &middot; <Link href={`/${e.vendorSlug}`}>{e.vendorName}</Link>
              {e.entity_ref ? <span className="muted small"> &middot; {e.entity_type.replace("_", " ")}: {e.entity_ref}</span> : <span className="muted small"> &middot; {e.entity_type.replace("_", " ")}</span>}
            </h3>
            {e.summary ? (
              <p>
                <Text>{e.summary}</Text>
              </p>
            ) : null}
            {e.field || e.old_value || e.new_value ? (
              <p className="small muted">
                {e.change_type}
                {e.field ? ` \u00b7 ${e.field}` : ""}: {e.old_value ? <Text>{e.old_value}</Text> : "\u2014"} &rarr; {e.new_value ? <Text>{e.new_value}</Text> : "\u2014"}
              </p>
            ) : null}
            <p className="small">
              Detected {formatDate(e.detected_at)}
              {e.effective_at ? <>, effective {formatDate(e.effective_at)}</> : null}. Verified {formatDate(e.confirmed_at)}. Source:{" "}
              {e.source_url ? <SourceLink url={e.source_url} domain={domainOf(e.source_url)} /> : "Not recorded"}.
            </p>
          </li>
        ))}
      </ol>
    </div>
  );
}
