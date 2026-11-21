# Evidence, 2026-11-21 (commit built from the Excellence round 4 fixes)

Made by `npm run evidence` (tests/evidence/evidence.spec.ts) against a local build with sample data.

- `home-390-*.webm`, `home-1440-*.webm`: home page scrolled top to bottom, with and without reduced motion. The script fails on any horizontal scroll.
- `crm-<screen>-375.png` / `-1440.png`: overview, leads, lead drawer, schedule, reviews, traffic, ask, settings. No horizontal scroll at 375 px (asserted).
- `axe.json`: WCAG 2 A/AA/2.1 AA scan of `/`, `/es`, `/crm/leads`, `/admin`: zero violations. The first run found a contrast failure (lost-status chip, count badges); fixed.
- `lighthouse.json`: mobile Lighthouse on `/` (local production build): performance 0.79, accessibility 0.96, best-practices 1.00, SEO 0.66.
  SEO is held down only by "Page is blocked from indexing", which is the intended preview-mode noindex. Performance is limited by total blocking time (770 ms, simulated slow CPU); LCP 0.9 s, CLS 0.
