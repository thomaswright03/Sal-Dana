# Data inventory (keep in step with /privacy)

| Category | About | Source | Stored | Recipients | Retention |
|---|---|---|---|---|---|
| Leads: name, phone, email, address, service, details, language, notes | Visitors | Booking form, chat | Vercel Blob `sal-dana-crm` (sfo1), private | Vercel; Anthropic via Ask AI (name, city, service, details, notes, visit; phone/email only when one lead is opened) | Non-won leads deleted after 24 months |
| Chat transcripts | Visitors | Chat | Blob, with the lead | Anthropic (processing) | Dropped after 12 months |
| Reviews: name, city, text, rating, permission note, relationship note | Customers | Owner | Blob | Public site (permission note stays private) | Until removed |
| Traffic totals: language, referrer origin, utm_source, named events | Nobody individually | First-party counter (`lib/track.ts`) | Blob | None | Totals only, no personal data |
| Owner session cookie `sd_crm` | Owner | Sign-in | Browser | None | Session |
| Request IPs | Visitors | Requests | Rate limiter memory (`lib/rate-limit.ts`); Vercel function logs | Vercel | Vercel's schedule |
| sessionStorage `sd-seen`, chat history | Visitors | Browser | Visitor's browser | None | Cleared at tab close |

Retention is enforced by `/api/cron/retention` (weekly, `vercel.json`; needs `CRON_SECRET`).
