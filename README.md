# AI Plan Limits (working name)

Static, SEO-first site that compares AI plan prices, usage limits and reset rules. Next.js App Router + TypeScript, data read-only from Supabase, deployed on Vercel.

M0 pages: `/`, `/compare`, `/[vendor]` (one per `vendors.slug`), `/status` (placeholder, noindex).

## Environment variables (names only, never commit values)

| Name | Purpose |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase public (anon / publishable) key. Read-only via RLS (verified rows only) |
| `SITE_URL` | Canonical origin once the domain is decided. Falls back to `VERCEL_URL` |
| `ALLOW_INDEXING` | `true` enables indexing, and only when `VERCEL_ENV=production`. Everything else is `noindex,nofollow` |
| `REVALIDATE_SECRET` | Protects `POST /api/revalidate` (header `x-revalidate-secret`) |

Without the Supabase variables the site still builds and shows an empty state.

## Develop

```bash
cp .env.example .env.local   # fill values locally; .env.local is gitignored
npm install
npm run dev
npm run lint && npm run build
```

## Rules baked into the code

- Only `verification_status = 'verified'` rows are rendered (RLS plus a second filter in `src/lib/data.ts`).
- Freshness config in `src/config/site.ts`: `STALE_WARN_DAYS = 7` (badge on that row), `STALE_NOINDEX_DAYS = 21` (page noindex only if all its rows are older).
- Value per dollar (`src/lib/value.ts`): only inside one vendor, same unit and window; multipliers resolved by chain to the 1x baseline; ranges never turned into a number; free plans excluded.
- Benchmarks (LMArena, Artificial Analysis) live in `src/config/benchmarks.ts`.
- Reminder CTA (`src/components/ReminderCta.tsx`) is hidden by `REMINDER_CTA_ENABLED = false`.
