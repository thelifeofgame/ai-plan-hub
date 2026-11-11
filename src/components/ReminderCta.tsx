import Link from "next/link";
import { REMINDER_CTA_ENABLED } from "@/config/site";

export type CtaPlacement = "home" | "compare" | "vendor" | "status" | "limit-reset" | "limits" | "vs" | "header" | "footer";

/**
 * Reset-reminder CTA. Hidden while REMINDER_CTA_ENABLED is false (M0): the signup form and /reminders do not exist yet.
 * Copy is from ia.md section 4. `placement` is kept for analytics once the form is live.
 */
export function ReminderCta({ placement }: { placement: CtaPlacement }) {
  if (!REMINDER_CTA_ENABLED) return null;
  return (
    <aside className="cta" data-placement={placement}>
      <h2>Get a reset reminder</h2>
      <p>
        We&apos;ll email you, or send a browser notification, using the official reset rule for your plan &mdash; a window- or account-assigned schedule, which you can also check in the
        product. We won&apos;t invent a countdown.
      </p>
      <Link href="/reminders">Get a reset reminder</Link>
    </aside>
  );
}
