# Sal Dana Renovations

Marketing site, AI booking assistant, and CRM for Sal Dana Renovations LLC, Alan's handyman and renovation business in Arizona.

- **Site** (`/`, and `/es` in Spanish): animated single-page marketing site with a booking form. Every word visitors read lives in `lib/copy.ts`, in English and Spanish, with a language switch in the header and footer.
- **Assistant**: a chat window on the site, powered by the Anthropic API, that answers questions and saves visit requests straight into the CRM. The same key powers Ask AI in the dashboard. Both stay off, with a clear message, until `ANTHROPIC_API_KEY` is set.
- **Owner dashboard** (`/crm`): password-protected. Overview with visitors, requests, a visitor-to-job funnel and jobs won; Leads (table and pipeline board); Schedule (week calendar); Reviews (choose which appear on the site); Traffic; Ask AI (plain-language questions about the business's own records); Settings.
- **Visitor counting**: the site counts its own visits through `/api/track` as anonymous daily totals. No cookies, no third-party trackers, nothing that identifies a person.

Built with Next.js (App Router), Tailwind CSS, Motion, and Lenis. Deployed on Vercel.

## Editing the content

Almost everything a visitor reads lives in [`lib/site.ts`](lib/site.ts): phone, email, service list, service area, working hours, process steps, and FAQs. The assistant reads the same file, so it stays in step with the site. Interface text and the full Spanish version live in [`lib/copy.ts`](lib/copy.ts). When a service, FAQ, or step changes in `lib/site.ts`, update its Spanish counterpart in `lib/copy.ts` too.

## Environment variables

| Name | Required | What it does |
| --- | --- | --- |
| `ANTHROPIC_API_KEY` | For the assistant | Anthropic API key. Without it the chat tells visitors to call instead. |
| `ANTHROPIC_MODEL` | No | Claude model for the assistant. Defaults to `claude-sonnet-5-5`. Check any other model with `npm run eval`. |
| `CRM_PASSWORD` | For the CRM | Owner password for `/crm`, at least 8 characters. Changing it signs everyone out. |
| `BLOB_READ_WRITE_TOKEN` | In production | Added by Vercel when a Blob store is connected. Leads are stored there as private JSON. |
| `CRON_SECRET` | In production | Any long random string. Vercel sends it to the cron routes (`/api/cron/retention`, `/api/cron/backup`); without it they return 401. |
| `NEXT_PUBLIC_DEMO_MODE` | No | Set to `1` for preview mode: noindex and the sample-data banner. Leave unset at launch. |
| `ADMIN_PASSWORD` | For `/admin` | Separate password (12+ characters) for the status page. Not the CRM password. |
| `ADMIN_STATUS_TOKEN` | For monitors | Bearer token accepted by `/admin/status.json`. |
| `RESEND_API_KEY` | For lead emails | Resend key used to email Alan about every new lead and to send failure alerts. |
| `LEAD_NOTIFY_EMAIL` | No | Where new-lead emails go. Defaults to the business email in `lib/site.ts`. |
| `ALERT_EMAIL` | No | Who hears about failed cron jobs. Defaults to `LEAD_NOTIFY_EMAIL`. |
| `EMAIL_FROM` | No | Sender, e.g. `Sal Dana <leads@yourdomain.com>`. Needs a domain verified in Resend; the default `onboarding@resend.dev` only delivers to the Resend account owner. |
| `BACKUP_BLOB_READ_WRITE_TOKEN` (or `BACKUP_READ_WRITE_TOKEN`, what Vercel creates with prefix BACKUP) | Recommended | Token of a second Blob store (`sal-dana-backups`); each daily backup is also written there. The newest 30 snapshots are kept in each store; older ones are deleted, so leads removed by retention leave backups within 30 days, and a restore skips leads past the 24-month cut-off. |

Copy `.env.example` to `.env.local` for local work. Never commit real values.

## Preview mode and sample data

Set `NEXT_PUBLIC_DEMO_MODE=1` to mark the whole site `noindex` while it is being reviewed. Remove the flag at launch.

In the dashboard, Settings has "Load sample data". It adds example leads (`lib/demo-leads.ts`) plus sample reviews and 120 days of sample visits (`lib/demo-data.ts`). Everything is flagged as a sample, sample reviews are labelled as samples on the public site, and "Remove sample data" deletes only the samples, leaving real records alone.

## Reviews

The reviews section on the site shows whatever is switched on under Reviews in the dashboard, and hides itself when nothing is. Add real reviews there, exactly as customers wrote them.

## Running locally

```bash
npm install
npm run dev
```

Without a Blob token, leads are written to `.data/` on disk so the form, assistant, and CRM all work locally.

## How bookings work

Visitors pick a day and one of three windows (morning, midday, afternoon). A window that already has a visit on it is not offered again. Every booking arrives in the CRM as a *requested* visit for Alan to confirm.

## Notes on protection

The lead form, the chat, and the CRM login are rate limited per visitor in memory, which slows casual abuse. For stronger protection, add a rate limit rule in the Vercel Firewall for `/api/chat` and `/api/lead`.

## Architecture

```
Browser ──> Next.js pages (/, /es, /crm, /admin)
   │
   ├─ POST /api/lead ─────────┐
   ├─ POST /api/chat ─> Anthropic (tools: check_availability, book_appointment, request_callback)
   │                          ├─> lib/booking.ts: claim slot marker (slots/DATE_WINDOW.json, write-if-absent)
   │                          │      -> save lead (leads/ID.json) -> email Alan (Resend)
   ├─ /api/crm/* (owner cookie)└─> Vercel Blob store `sal-dana-crm` (private JSON; .data/ locally)
   ├─ /admin, /admin/status.json (admin cookie or bearer token) -> real read-only checks + ops/<key>.json (one document per job)
   └─ Vercel cron: /api/cron/retention (weekly), /api/cron/backup (daily) -> record result, email on failure
```

`proxy.ts` guards `/crm` and `/admin` with two separate sign-ins. A booked slot is a marker blob created with
`allowOverwrite:false`, so two simultaneous bookings produce one appointment. CRM saves send the lead's
`updatedAt`; a stale save gets a 409 and the dashboard says the lead changed.

## Status page, kill switch and alerts

- `/admin` (sign in with `ADMIN_PASSWORD`) shows Important / Key / Basic checks with OK, Warning, Down or Unknown.
  `/admin/status.json` returns the same as JSON (`product`, `checked_at`, `overall` = worst Important function, `functions[]` with `tier`, `name`, `status`, `last_checked`, `last_success`, `next_expected_run`, `detail`).
- Settings > **Assistant on/off** in `/crm` stops the website chat and Ask AI on the next request (stored in Blob,
  no redeploy). The chat then shows the call-or-text message.
- A failed new-lead email is logged and shown on `/admin`; the lead is never lost. A failed cron run emails `ALERT_EMAIL`.

## Backup and restore

A daily cron writes `backups/YYYY-MM-DD.json` (all leads and reviews) to the main store, and to the second store when
`BACKUP_BLOB_READ_WRITE_TOKEN` is set. To restore, sign in at `/admin`, then
`GET /api/admin/restore` lists snapshots and `POST /api/admin/restore {"date":"2026-11-21","ids":["LEAD_ID"]}`
puts back missing records (existing ones are kept unless `"overwrite":true`; `"from":"second"` reads the second store).
The round trip (back up, delete a lead, restore it) is covered by `tests/unit/backup.test.ts`.

**Drill on the real stores (2026-11-21).** RPO is 24 h (daily job, 11:00 UTC). At 01:26 UTC `/api/cron/backup` on production
returned 200 in 2.9 s with 50 leads and 10 reviews. `backups/2026-11-20.json` existed in both `sal-dana-crm` and
`sal-dana-backups`, and /admin showed "Latest backup" OK. The snapshot was read from the second store and restored into an
empty scratch store: 50 leads and 10 reviews came back, matching the snapshot, in 70 ms of restore work (measured RTO for the
data step is under a minute; add a few minutes to sign in and trigger it). `CRON_SECRET` was unreadable (sensitive) so it was rotated.

Reviews are stored one document each (`reviews/<id>.json`), so two saves at once can't overwrite each other.
Evidence (videos, screenshots, axe, Lighthouse) is in `docs/evidence/`; regenerate it with `npm run evidence`.

## Tests, CI and evals

`npm test` (unit, Anthropic SDK mocked), `npm run test:e2e` (Playwright: booking form to CRM), `npm run typecheck`,
`npm run lint`. GitHub Actions (`.github/workflows/ci.yml`) runs all of them on every PR and push to main; `main`
requires the `Lint, typecheck, test, build` and `End-to-end (Playwright)` checks. `npm run eval` runs 15 recorded
conversations against the real API (skipped without a key).

## Deploy and rollback

_Drill 2026-11-21:_ rolled production back to the previous deployment through the Vercel API and promoted the newest one again; each switch was live in about 7 seconds._

Deploys are Vercel: pushing `main` builds and ships. Set the env vars above in the Vercel project first. To roll
back, open the Vercel project > Deployments, pick the last good one and choose **Promote to Production** (or
`vercel rollback`). Data is not part of a deploy; restore data from a backup as above.

## Concurrency notes
- Visit slots: `slots/<date>_<window>_g<n>.json`, created write-if-absent and never overwritten; taking over a cancelled slot writes generation n+1, so only one claimer wins. Availability reads these markers, not every lead.
- Owner visits set in the CRM claim the same marker; a taken window returns 409 `slot-taken` and the drawer offers "Book it anyway".
- Failed new-lead emails leave `pending-email/<id>.json`; the daily backup cron and the next successful send retry them. /admin shows how many are waiting.
- Known limits: reviews are one document (two simultaneous edits can drop one); the lead edit check (`updatedAt`) isn't a conditional write. Fine for a single owner.
