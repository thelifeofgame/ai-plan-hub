// M0 /status: static list of official status pages (source: data editor review 2026-11-11, ia.md 3.8).
// No live status is polled or shown. Placeholder wording is marked for the SEO teammate.
export const STATUS_LINKS_CHECKED_AT = "2026-11-11";

export interface StatusLink {
  vendorSlug: string;
  vendorName: string;
  url: string;
  note: string;
}

export const STATUS_LINKS: StatusLink[] = [
  {
    vendorSlug: "chatgpt",
    vendorName: "ChatGPT",
    url: "https://status.openai.com",
    note: "Verified official status page.",
  },
  {
    vendorSlug: "claude",
    vendorName: "Claude",
    url: "https://status.claude.com",
    note: "Verified official status page. The older status.anthropic.com address redirects here.",
  },
  {
    vendorSlug: "grok",
    vendorName: "Grok",
    url: "https://status.x.ai",
    note: "Verified as the official Status link from the xAI pricing page. The page is rendered with JavaScript, so we do not read a current status from it. Link only.",
  },
  {
    vendorSlug: "gemini",
    vendorName: "Gemini",
    url: "https://www.google.com/appsstatus/dashboard/",
    note: "Google Workspace Status Dashboard (it includes Gemini / Gemini Notebook rows). A dedicated official status page for the consumer Gemini app has not been found, so this is a stand-in, not a personal-app status board.",
  },
];
