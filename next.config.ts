import type { NextConfig } from "next";
import { VS_PAIRS, inverseSlug, pairSlug } from "./src/config/pairs";

const nextConfig: NextConfig = {
  trailingSlash: false,
  poweredByHeader: false,
  // Inverse vs URLs 301 to the canonical direction (m1-pseo.md section 1).
  async redirects() {
    return VS_PAIRS.map((x) => ({ source: `/${inverseSlug(x)}`, destination: `/${pairSlug(x)}`, statusCode: 301 }));
  },
};

export default nextConfig;
