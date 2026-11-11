import Link from "next/link";
import { sourceLinks, type FaqItem } from "@/lib/faq";
import { SourceLink } from "./SourceLink";

/** Visible FAQ. Each answer ends with its source link(s). Renders nothing when there are no items. */
export function Faq({ items }: { items: FaqItem[] }) {
  if (items.length === 0) return null;
  return (
    <section>
      <h2>Frequently asked questions</h2>
      {items.map((it) => (
        <div key={it.q}>
          <h3>{it.q}</h3>
          <p className="prose">
            {it.link ? (
              <>
                {it.a.slice(0, it.a.length - it.link.label.length)}
                <Link href={it.link.href}>{it.link.label}</Link>
              </>
            ) : (
              it.a
            )}{" "}
            <span className="small muted">
              Source:{" "}
              {sourceLinks(it).map((s, i) => (
                <span key={s.url}>
                  {i > 0 ? ", " : ""}
                  <SourceLink url={s.url} domain={s.domain} />
                </span>
              ))}
            </span>
          </p>
        </div>
      ))}
    </section>
  );
}
