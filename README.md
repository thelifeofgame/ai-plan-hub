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

## After a data reimport: refresh the site

Pages are statically generated and refresh on their own every hour (ISR). To refresh immediately after a CSV reimport, call the revalidation route. It refreshes every page (home, compare, vendor pages, changelog, and any page added later), plus `sitemap.xml` and `robots.txt`:

```bash
curl -X POST https://<site-host>/api/revalidate -H "x-revalidate-secret: <REVALIDATE_SECRET>"
# {"ok":true,"revalidatedAt":"..."}  (401 = wrong secret, 503 = REVALIDATE_SECRET not set on that deployment)
```

Take the secret from the Vercel environment settings; never paste it into the repo, chat or shared files.

## Changelog data

`/changelog` reads verified rows of `change_log` from Supabase. The import format and the migration (`migrations/0005_change_log_import.sql`: adds `entity_ref`, `dedupe_key` and a unique index) live in the data workspace, not in this repo. The page works before and after that migration is applied.
