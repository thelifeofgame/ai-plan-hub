import { isCjk } from "@/lib/format";

/** Renders stored text; marks Chinese notes with lang so the English page stays valid and accessible. */
export function Text({ children }: { children: string }) {
  return isCjk(children) ? <span lang="zh-Hans">{children}</span> : <>{children}</>;
}
