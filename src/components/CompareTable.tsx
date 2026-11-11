"use client";

import { useMemo, useState } from "react";
import type { PlanView } from "@/lib/views";
import { LimitsCell, ModelsCell, NotesCell, PlanNameCell, PriceCell, ResetCell, SourcesCell, VerifiedCell } from "./PlanCells";

/** Compare table. All rows are in the server-rendered HTML; filters only hide rows in the browser. No URL params. */
export function CompareTable({ rows }: { rows: PlanView[] }) {
  const [vendor, setVendor] = useState("all");
  const [audience, setAudience] = useState("all");
  const [hideFree, setHideFree] = useState(false);

  const vendors = useMemo(() => Array.from(new Map(rows.map((r) => [r.vendorSlug, r.vendorName])).entries()), [rows]);
  const audiences = useMemo(() => Array.from(new Set(rows.map((r) => r.audience).filter((a): a is string => !!a))), [rows]);
  const shown = rows.filter((r) => (vendor === "all" || r.vendorSlug === vendor) && (audience === "all" || r.audience === audience) && !(hideFree && r.isFree));

  return (
    <div>
      <div className="filters" role="group" aria-label="Filter plans">
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
        <label>
          Audience{" "}
          <select value={audience} onChange={(e) => setAudience(e.target.value)}>
            <option value="all">All</option>
            {audiences.map((a) => (
              <option key={a} value={a}>
                {a}
              </option>
            ))}
          </select>
        </label>
        <label>
          <input type="checkbox" checked={hideFree} onChange={(e) => setHideFree(e.target.checked)} /> Hide free plans
        </label>
        <span className="muted small" aria-live="polite">
          Showing {shown.length} of {rows.length} plans
        </span>
      </div>
      <div className="tablewrap">
        <table className="data">
          <caption className="sr">Plans compared: price, models, usage limits, reset rules, last verified, sources</caption>
          <thead>
            <tr>
              <th scope="col">Plan</th>
              <th scope="col">Price</th>
              <th scope="col">Included models</th>
              <th scope="col">Usage limits (official wording)</th>
              <th scope="col">Reset rules</th>
              <th scope="col">Shared pools and overage</th>
              <th scope="col">Last verified</th>
              <th scope="col">Sources</th>
            </tr>
          </thead>
          <tbody>
            {shown.map((p) => (
              <tr key={`${p.vendorSlug}/${p.planSlug}`}>
                <th scope="row">
                  <PlanNameCell p={p} showVendor />
                </th>
                <td>
                  <PriceCell p={p} />
                </td>
                <td>
                  <ModelsCell p={p} />
                </td>
                <td>
                  <LimitsCell p={p} />
                </td>
                <td>
                  <ResetCell p={p} />
                </td>
                <td>
                  <NotesCell p={p} />
                </td>
                <td>
                  <VerifiedCell p={p} />
                </td>
                <td>
                  <SourcesCell p={p} />
                </td>
              </tr>
            ))}
            {shown.length === 0 ? (
              <tr>
                <td colSpan={8}>No plans match these filters.</td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}
