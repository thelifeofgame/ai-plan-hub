import { SourceLink } from "./SourceLink";

export function Sources({ sources }: { sources: { url: string; domain: string }[] }) {
  if (sources.length === 0) return <span>Not recorded</span>;
  return (
    <ul className="plain">
      {sources.map((s) => (
        <li key={s.url}>
          <SourceLink url={s.url} domain={s.domain} />
        </li>
      ))}
    </ul>
  );
}
