import type { PlanView } from "@/lib/views";
import { LastVerified } from "./LastVerified";
import { Sources } from "./Sources";
import { Text } from "./Text";

export function PriceCell({ p }: { p: PlanView }) {
  return (
    <>
      <div>{p.monthly ?? "Not published"}</div>
      {p.annual ? <div className="muted">{p.annual}</div> : null}
      {p.priceNotes.map((n) => (
        <div key={n} className="muted small">
          <Text>{n}</Text>
        </div>
      ))}
    </>
  );
}

export function ModelsCell({ p }: { p: PlanView }) {
  if (p.models.length === 0) return <span className="muted">Not published</span>;
  return (
    <ul className="plain small">
      {p.models.map((m) => (
        <li key={m.name}>
          <Text>{m.name}</Text>
        </li>
      ))}
    </ul>
  );
}

export function LimitsCell({ p }: { p: PlanView }) {
  if (p.limits.length === 0) return <span className="muted">Not published</span>;
  // Several rows often share one official quote: show each distinct quote once.
  const seen = new Set<string>();
  return (
    <ul className="plain small">
      {p.limits.map((l, i) => {
        const showQuote = !!l.quote && !seen.has(l.quote);
        if (l.quote) seen.add(l.quote);
        return (
        <li key={i}>
          <strong>{l.label}</strong>: {l.limit}. {l.window}.
          {showQuote ? <q className="quote">{l.quote}</q> : null}
        </li>
        );
      })}
    </ul>
  );
}

export function ResetCell({ p }: { p: PlanView }) {
  if (p.limits.length === 0) return <span className="muted">Not published</span>;
  return (
    <ul className="plain small">
      {p.limits.map((l, i) => (
        <li key={i}>
          <strong>{l.label}</strong>: {l.resetRule ? <Text>{l.resetRule}</Text> : "Not published"}
          {l.resetIn ? (
            <>
              {" "}
              Shown in the product at: <Text>{l.resetIn}</Text>.
            </>
          ) : null}
        </li>
      ))}
    </ul>
  );
}

export function NotesCell({ p }: { p: PlanView }) {
  const shared = Array.from(new Set(p.limits.map((l) => l.shared).filter((s): s is string => !!s)));
  if (shared.length === 0 && !p.overage) return <span className="muted">None recorded</span>;
  return (
    <ul className="plain small">
      {shared.map((s) => (
        <li key={s}>
          <em>Shared pool:</em> <Text>{s}</Text>
        </li>
      ))}
      {p.overage ? (
        <li>
          <em>Over the limit:</em> <Text>{p.overage}</Text>
        </li>
      ) : null}
    </ul>
  );
}

export function VerifiedCell({ p }: { p: PlanView }) {
  return <LastVerified iso={p.lastVerified} recheck={p.recheck} />;
}

export function SourcesCell({ p }: { p: PlanView }) {
  return <Sources sources={p.sources} />;
}

export function PlanNameCell({ p, showVendor }: { p: PlanView; showVendor: boolean }) {
  return (
    <>
      {showVendor ? <div className="muted small">{p.vendorName}</div> : null}
      <strong>
        <Text>{p.planName}</Text>
      </strong>
      <div className="muted small">
        {p.planStatus ?? "status not recorded"}
        {p.audience ? `, ${p.audience}` : ""}
      </div>
    </>
  );
}
