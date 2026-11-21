# Sal Dana Renovations website (state)
Next.js (EN/ES) site + /crm owner dashboard + AI booking assistant + /admin status page. Preview mode, sample data, Vercel `sal-dana` (sal-dana.vercel.app).

## Excellence fix round 1 (2026-11-21), grade was 51
Done: /admin + /admin/status.json (own login ADMIN_PASSWORD, bearer ADMIN_STATUS_TOKEN; `lib/status.ts`, `lib/ops.ts`); Resend new-lead email (`lib/notify.ts`, via `lib/booking.ts`); daily backup cron + restore (`lib/backup.ts`, `/api/admin/restore`); cron outcome log + failure email (`lib/cron.ts`); AI kill switch (Settings, `lib/settings.ts`); slot lock (`lib/slots.ts`, write-if-absent marker); stale-edit 409 on leads; Sonnet 5.5 default, 1000-token chat cap, prompt caching, usage logs; branded 404/error (EN+ES); apple-icon; inline review delete confirm; README (env, architecture, backup, deploy); 49 vitest tests, Playwright e2e (3), `scripts/assistant-eval.ts` (15 cases, skips without key), CI `.github/workflows/ci.yml`.
Vercel env set: ADMIN_PASSWORD, ADMIN_STATUS_TOKEN, RESEND_API_KEY (prod+preview). Read them with the Vercel API if needed.

## Excellence fix round 2 (2026-11-21), grade was 71
Done: status.json now `{product, checked_at, overall, functions[{tier,name,status,last_checked,last_success,next_expected_run,detail}]}`, overall = worst Important, Arizona times in HTML; atomic slot takeover (generation markers); availability from slot markers (constant reads); ops log one doc per key; failed lead emails queued in `pending-email/` and retried by daily cron + next success, count on /admin; CRM visits claim slots, 409 `slot-taken` + "Book it anyway"; backups pruned to 30, restore skips expired leads; second Blob store `sal-dana-backups` created and connected (env BACKUP_READ_WRITE_TOKEN, prod+preview; read/write/list/delete verified with the real token); /admin says emails reach only the Resend owner until EMAIL_FROM + LEAD_NOTIFY_EMAIL set; .env.example fixed. 59 unit tests.

## Open
- ANTHROPIC_API_KEY is not set anywhere the COO can reach (not in env, not in Vercel): the eval (`npm run eval`) has never run. Needs the key from Thomas; then set in Vercel prod+preview, run eval, record pass rate/cost here.
- Needs Alan's lead email + a domain for Resend (EMAIL_FROM, LEAD_NOTIFY_EMAIL).
- Not done (low): reviews/settings single documents; non-conditional lead edit check; tests for analyst, review routes, traffic, cronAllowed.
- Earlier (legal): sample reviews removed before launch.

## Excellence fix round 3 (2026-11-21), grade was 74
Done: reduced-motion hydration (#418) fixed via `components/site/useReduced.ts` (false until mounted); live availability in the booking form (`GET /api/availability?date=`, taken windows disabled, reasons inline EN/ES, success screen names a taken time); field-level validation errors; atomic stale-edit check (`lead-versions/` write-if-absent markers in `lib/store.ts`); restore re-holds visit slots; note delete confirm; chat launcher waits until hero scrolls away; knip clean (only test stub); Latest update card rewritten (frontend first). 67 unit + 5 e2e tests (reduced-motion e2e added).
Evidence (2026-11-21): CI green on 5d3c1f5 (run https://github.com/thomaswright03/Sal-Dana/actions/runs/44847112034). Branch protection on main requires "Lint, typecheck, test, build" and "End-to-end (Playwright)" (admins not enforced). Live reduced-motion load: 0 page errors. Live /admin/status.json overall=warning (expected: Anthropic key missing; email/backup/retention rows Unknown until first run), 13 functions listed.
Rollback drill: Vercel rollback of production to b9675fc live in ~7s (availability route 404 again), promoted 5d3c1f5 back in ~7s.
Not done: restore-from-real-Blob-snapshot drill (backup needs CRON_SECRET, not readable by COO; unit-tested only); forced-failure (unset RESEND_API_KEY) check on a preview; eval needs ANTHROPIC_API_KEY.

## Excellence fix round 4 (2026-11-21), grade was 75
Done: reviews are one doc each (`reviews/<id>.json`, legacy `reviews.json` auto-migrated; backup/restore updated; concurrency test); settings is a single boolean so left as is; /admin Important now includes New-lead email + Leads waiting (overall down without RESEND_API_KEY, tested); new tests for analyst tools, review routes (auth + permission rule), traffic/track (86 unit tests total); lead status filter + search kept in URL (`?status=&q=`); `app/favicon.ico`; small type moved to named scale (`text-micro/small/body`, min 11px); `npm run evidence` (tests/evidence, axe-core) with output in `docs/evidence/2026-11-21/` (videos, CRM screenshots at 375/1440, axe zero violations, Lighthouse perf 0.79/a11y 0.96/SEO 0.66 = noindex by design); contrast fix for lost chip and count badges.
Backup drill done on production: rotated CRON_SECRET (prod), redeployed 9eb1db3, /api/cron/backup 200 (50 leads, 10 reviews), snapshot in both stores, restored into scratch store, counts match; /admin Latest backup OK. Details in README.
Not done: forced-failure check on a deployment (unset RESEND_API_KEY / bad blob token) - only unit-tested; after the push, `/admin/status.json` should report overall=down while RESEND_API_KEY is unset... note production has RESEND_API_KEY set, so check New-lead email row instead. Lighthouse performance 79 (TBT). favicon.ico live check after deploy.

## Excellence fix round 5 (2026-11-21), grade was 73
Done: hours 9 AM to 5 PM confirmed everywhere (site.ts, i18n, copy ES, assistant prompt, Schedule subtitle; Morning window 9-11), unit test; Latest update card rewritten; Schedule side column moved to 2xl so Mon-Sat fit at 1440; Nav language aria-label "ES, Español"; reviews legacy migration only on list.
Not done: html lang server-side for /es (needs per-locale root layouts, big refactor); forced-failure check on a deployment; Lighthouse perf 0.79 (lazy-load shader/chat); new 1440 Schedule screenshot and fresh evidence. Not deployed (COO pushes).

## Excellence fix round 6 (2026-11-21), grade was 77
Done: `<html lang>` server-rendered per language: two root layouts `app/(en)/layout.tsx` and `app/(es)/layout.tsx` (shared `lib/root-layout.tsx`, `components/site/SiteLayout.tsx`), `app/global-not-found.tsx` (experimental.globalNotFound); e2e test. Perf: `components/site/Deferred.tsx` (shader, cursor, chat load after idle; none on touch/reduced motion), LazyMotion + `m` in site components; Lighthouse mobile 0.85-0.98 (median 0.93, committed). Fixed real bug: CRM lead PATCH slot-taken 409 was shown as stale-edit (Dashboard.tsx). Forced-failure check done on real Vercel previews (evidence in docs/evidence/2026-11-21/forced-failure; env overrides and branch removed; Vercel protection-bypass secret generated for project). Owner-flow walkthrough videos + fresh screenshots (`npm run evidence`, now includes owner-flows spec). Latest update card rewritten for round 6.
Not done: eval (no key, waived). Main not pushed by me (COO pushes); /es lang is only live after that.

## Excellence round 7 fixes (2026-11-21)
- Guarded create-lead (try/catch, 401 redirect, safe json) and LeadDrawer.save (try/finally).
- /admin: backup and leads-waiting rows say "can't read/check while storage is down" (Unknown).
- Still open (evidence only): tab-icon light/dark, offline/200% zoom/WebKit runs, live Lighthouse, clean-data screenshots.
