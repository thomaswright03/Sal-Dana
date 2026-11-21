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
- Not done (low): reviews/settings single documents; non-conditional lead edit check; tests for analyst, review routes, traffic, cronAllowed; branch protection once CI has run.
- Restored leads with appointments don't recreate slot markers.
- Earlier (legal): sample reviews removed before launch.
