import { Text } from "./Text";
import { formatRatio, type ValueGroup } from "@/lib/value";

/** Vendor-internal value per dollar. Never mixes vendors. Each computed row has a formula in the footnotes. */
export function ValueSection({ vendorName, groups }: { vendorName: string; groups: ValueGroup[] }) {
  if (groups.length === 0) {
    return <p className="muted">No {vendorName} allowance is published in a form we can compare per dollar from verified rows (same unit, same window, same base), so no ratio is shown.</p>;
  }
  const notes = groups.flatMap((g) => g.rows.filter((r) => r.formula).map((r) => `${g.title}. ${r.formula}`));
  return (
    <div>
      {groups.map((g) => (
        <div key={g.id} className="tablewrap">
          <table className="data narrow">
            <caption>
              {vendorName}: {g.title}
            </caption>
            <thead>
              <tr>
                <th scope="col">Plan</th>
                <th scope="col">Allowance</th>
                <th scope="col">Monthly price</th>
                <th scope="col">{g.unitLabel}</th>
              </tr>
            </thead>
            <tbody>
              {g.rows.map((r) => (
                <tr key={r.planSlug}>
                  <th scope="row">
                    <Text>{r.planName}</Text>
                  </th>
                  <td>{r.quantity ?? "\u2014"}</td>
                  <td>{r.price ?? "\u2014"}</td>
                  <td>{r.perUsd !== null ? formatRatio(r.perUsd) : (r.note ?? "\u2014")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ))}
      <ol className="footnotes small">
        {notes.map((n) => (
          <li key={n}>{n}</li>
        ))}
      </ol>
    </div>
  );
}
