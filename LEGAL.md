# Legal facts and laws (not legal advice)

Checked by the COO on 2026-11-21 from general knowledge; statute text not re-read online. Have a lawyer confirm.

## Facts on record
- Business: Sal Dana Renovations LLC, Arizona. ACC entity number: **unknown** (Alan to provide). The site no longer says "registered".
- Arizona ROC contractor licence: **unknown** (Alan to confirm). If none, ads must say "not a licensed contractor" and work is limited by the handyman exemption (A.R.S. §32-1121(A)(14), under $1,000, no permit). The site makes no licence or insurance claim; the assistant defers these questions to Alan.
- Round 2: "on site when he says he will be", "no subcontracted surprises", "does the work himself" removed from site (EN/ES) and assistant prompt; hours now shown as "typically" and confirmed at booking. Still unconfirmed with Alan: service list, area, hours. Spanish copy not native-reviewed.
- Vendors: Vercel (hosting, Blob store sal-dana-crm in sfo1, functions iad1); Anthropic API (not switched on; record the account and commercial terms when the key is set; commercial terms exclude training on API data).

## Laws that apply
| Law | Why | Checked |
|---|---|---|
| A.R.S. §32-1121 and ROC advertising rules | Contractor licensing and "not a licensed contractor" wording | 2026-11-21 (verify text) |
| Arizona Consumer Fraud Act, A.R.S. §44-1521 ff. | Honest claims and reviews | 2026-11-21 |
| A.R.S. §18-551/552 | Breach notice (see BREACH.md) | 2026-11-21 |
| FTC Act §5 | Unfair or deceptive claims, AI chat statements | 2026-11-21 |
| 16 CFR 465 (reviews rule) and 16 CFR 255 (Endorsement Guides) | Real reviews, disclosed relationships, no suppression | 2026-11-21 |
| ADA Title III | Website accessibility | 2026-11-21 |
| California BOT Act | Only if marketing reaches California | 2026-11-21 |

## Why others don't apply
- CCPA/CPRA: Arizona-only business below thresholds, no sale or sharing. GDPR: no EU targeting.
- TCPA/CAN-SPAM: the site sends no calls, texts or marketing emails (only tel/sms/mailto links).
- COPPA: not directed to children; policy says 18+.
- No Arizona comprehensive privacy law.

## Open items needing Alan or Thomas
ACC number; ROC licence status; client agreement between Wright AI Solutions and Sal Dana Renovations LLC; permission record for each real review; lawyer review of terms.


## Round 2 (2026-11-21)
- CRON_SECRET set in Vercel production (project sal-dana); first cron run still to be confirmed in logs after redeploy.
- Terms: 18+, review removal contact (7 days), indemnity, bold disclaimer/limit (lawyer to review wording). Booking form links Terms.
- Not done (need key/browser/web access): AI1/AI4/AI5 probes and Anthropic terms, Vercel DPA record, statute re-read (L12), axe scan (L19), USPTO search (L20), real-browser walk (L1).
