import { indexXml, xmlResponse } from "@/lib/sitemaps";

// Static + ISR like the pages; /api/revalidate refreshes it. Segment config must be literals.
export const dynamic = "force-static";
export const revalidate = 3600;

export async function GET() {
  return xmlResponse(await indexXml());
}
