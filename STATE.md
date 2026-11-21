# Sal Dana Renovations website (state)
Next.js (EN/ES) site + /crm owner dashboard + AI booking assistant + /admin status page. Preview mode, sample data, Vercel `sal-dana` (sal-dana.vercel.app).

## Excellence fix round 1 (2026-11-21), grade was 51
Done: /admin + /admin/status.json (own login ADMIN_PASSWORD, bearer ADMIN_STATUS_TOKEN; `lib/status.ts`, `lib/ops.ts`); Resend new-lead email (`lib/notify.ts`, via `lib/booking.ts`); daily backup cron + restore (`lib/backup.ts`, `/api/admin/restore`); cron outcome log + failure email (`lib/cron.ts`); AI kill switch (Settings, `lib/settings.ts`); slot lock (`lib/slots.ts`, write-if-absent marker); stale-edit 409 on leads; Sonnet 5.5 default, 1000-token chat cap, prompt caching, usage logs; branded 404/error (EN+ES); apple-icon; inline review delete confirm; README (env, architecture, backup, deploy); 49 vitest tests, Playwright e2e (3), `scripts/assistant-eval.ts` (15 cases, skips without key), CI `.github/workflows/ci.yml`.
Vercel env set: ADMIN_PASSWORD, ADMIN_STATUS_TOKEN, RESEND_API_KEY (prod+preview). Read them with the Vercel API if needed.

## Open
- Resend default sender only delivers to the Resend account owner: verify a domain + set EMAIL_FROM, set LEAD_NOTIFY_EMAIL once Alan confirms the address (until then lead emails log a failure on /admin; leads are safe).
- Create a second Blob store, set BACKUP_BLOB_READ_WRITE_TOKEN (backups currently in the same store under backups/).
- Restore tested via unit test on the file store, not yet against a scratch Blob store.
- Not done: #14 lead index (listLeads still reads all; fine at this volume). Eval never run against the real API (no key).
- Set ANTHROPIC_API_KEY, run `npm run eval`, tune the model; downgrade to Haiku only if eval passes.
- Branch protection needs the CI checks to have run once.
- Earlier (legal): Alan's ACC/ROC status, client agreement, review permissions, sample reviews removed before launch, CRON_SECRET set.
