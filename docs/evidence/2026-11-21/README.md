# Evidence, 2026-11-21 (regenerated in Excellence fix round 6 on the current build)

Made by `npm run evidence` (tests/evidence/evidence.spec.ts) against a local build with sample data.

- `home-390-*.webm`, `home-1440-*.webm`: home page scrolled top to bottom, with and without reduced motion. The script fails on any horizontal scroll.
- `crm-<screen>-375.png` / `-1440.png`: overview, leads, lead drawer, schedule, reviews, traffic, ask, settings. No horizontal scroll at 375 px (asserted).
- `axe.json`: WCAG 2 A/AA/2.1 AA scan of `/`, `/es`, `/crm/leads`, `/admin`: zero violations. The first run found a contrast failure (lost-status chip, count badges); fixed.
- `lighthouse.json`: mobile Lighthouse on `/` (local production build): performance 0.93 (median of three runs: 0.85, 0.94, 0.93; the CPU of this runner is noisy, five earlier runs of the same build gave 0.90 and 0.98), accessibility 0.96, best-practices 1.00, SEO 0.66.
  SEO is held down only by "Page is blocked from indexing", which is the intended preview-mode noindex. Performance was 0.79 before round 6; shader, cursor and chat are now deferred and motion uses LazyMotion. TBT about 300 ms, LCP 1.0 s, CLS 0.

## Round 6 additions
- `flow-*.webm`: owner-flow walkthroughs on the current build (`tests/evidence/owner-flows.spec.ts`): lead add/edit/delete; visit confirm with a slot conflict and "Book it anyway" (this found and fixed a bug: a slot-taken 409 was shown as "lead changed"); review add and publish; assistant kill switch; /admin sign-in and status page.
- `forced-failure/`: run on real Vercel preview deployments (`scripts/forced-failure.mjs`). `resend-unset-*`: RESEND_API_KEY empty on the branch, a synthetic booking still shows the success screen, `/admin/status.json` overall `down`, "New-lead email" down. `bad-blob-token-*`: BLOB_READ_WRITE_TOKEN invalid, the form shows "We couldn't save your request. Please call or text us instead.", status `down` with "Blob storage" and "Booking form saves a lead" down. The branch overrides, the branch and the synthetic lead were removed afterwards.
- `crm-schedule-1440.png` shows Mon to Sat fully visible and the Morning window as 9 to 11am. The `/es` page is served as `<html lang="es">` (e2e test).
