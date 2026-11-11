import { formatDate } from "@/lib/fresh";

export function LastVerified({ iso, recheck }: { iso: string | null; recheck: boolean }) {
  return (
    <span className="lv">
      <time dateTime={iso ?? undefined}>{formatDate(iso)}</time>
      {recheck ? <span className="badge" title="Last verified more than 7 days ago">Pending re-check</span> : null}
    </span>
  );
}
