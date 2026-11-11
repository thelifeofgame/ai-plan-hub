// M0 /status: static list of official status pages (source: data editor review 2026-11-11, ia.md 3.8 and 10.3).
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
    url: "https://aistudio.google.com/status",
    note: "Official status page for Google AI Studio and the Gemini API. The consumer Gemini app has no official status page of its own, so this page does not cover it.",
  },
];
