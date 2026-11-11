import { cache } from "react";
import { getSiteData } from "./data";

/** One read per render pass (metadata + page share it). */
export const loadSiteData = cache(getSiteData);
