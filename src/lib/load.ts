import { cache } from "react";
import { getChangeLog, getSiteData } from "./data";

/** One read per render pass (metadata + page share it). */
export const loadSiteData = cache(getSiteData);
export const loadChangeLog = cache(getChangeLog);
