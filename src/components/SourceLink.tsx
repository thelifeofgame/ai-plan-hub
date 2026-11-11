"use client";

import { track } from "@vercel/analytics";

/** Outbound link to an official source. Shows the source domain; reports the click to Vercel Web Analytics. */
export function SourceLink({ url, domain }: { url: string; domain: string }) {
  return (
    <a href={url} target="_blank" rel="noopener noreferrer" onClick={() => track("official_source_click", { domain })}>
      {domain}
    </a>
  );
}
