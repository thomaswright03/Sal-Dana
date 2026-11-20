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
| `ANTHROPIC_MODEL` | No | Claude model for the assistant. Defaults to `claude-fable-5-2`. |
| `CRM_PASSWORD` | For the CRM | Owner password for `/crm`, at least 8 characters. Changing it signs everyone out. |
| `BLOB_READ_WRITE_TOKEN` | In production | Added by Vercel when a Blob store is connected. Leads are stored there as private JSON. |

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
