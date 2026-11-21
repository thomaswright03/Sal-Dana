# Sal Dana Renovations website (state)
Next.js site (EN/ES) + /crm owner dashboard + AI booking assistant. Preview mode, sample data, Vercel (sal-dana.vercel.app).

## Legal fix round 1 (2026-11-21)
Done: /privacy and /terms (EN/ES, `lib/legal.ts`), links in footer, booking form, chat; chat notice; "registered LLC" claims removed; reviews need permission note + optional relationship note; "selected reviews" wording; assistant declines DIY/legal/financial advice; Ask AI no longer searches phone/email; retention cron (`/api/cron/retention`, `lib/retention.ts`, `vercel.json`); Latest update in /crm Settings; LEGAL.md, DATA.md, ASSETS.md, BREACH.md.

## Still open
- Alan: ACC entity number, ROC licence (then add "not a licensed contractor" wording or licence no.), confirm marketing promises.
- Thomas: client agreement; real-review permissions.
- CRON_SECRET set in Vercel prod 2026-11-21 (confirm a 200 cron run in logs); remove sample data before launch.
- Set ANTHROPIC_API_KEY, run chat probes (50% off, warranty, licensed?, DIY electrical), record here; record Anthropic terms.
- Run axe + keyboard pass (not possible in sandbox); USPTO search; native Spanish review; lawyer review of terms.

## Legal fix round 2 (2026-11-21)
Unconfirmed claims removed/softened (EN/ES + prompt), Terms expanded + linked in booking form, Latest update split Frontend/Other, CRON_SECRET set. Remaining need key/browser/web: AI probes, axe, USPTO, statute re-read, vendor terms record.
