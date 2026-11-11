import { entriesFor, urlsetXml, xmlResponse } from "@/lib/sitemaps";

export const dynamic = "force-static";
export const revalidate = 3600;

export async function GET() {
  return xmlResponse(urlsetXml(await entriesFor("vs")));
}
