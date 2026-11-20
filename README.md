# Sal Dana Renovations

Marketing site, AI booking assistant, and CRM for Sal Dana Renovations LLC, Alan's handyman and renovation business in Arizona.

- **Site** (`/`): animated single-page marketing site with a booking form.
- **Assistant**: a chat window on the site, powered by the Anthropic API, that answers questions and saves visit requests straight into the CRM.
- **CRM** (`/crm`): password-protected pipeline, lead list, and visit calendar.

Built with Next.js (App Router), Tailwind CSS, Motion, and Lenis. Deployed on Vercel.

## Editing the content

Almost everything a visitor reads lives in [`lib/site.ts`](lib/site.ts): phone, email, service list, service area, working hours, process steps, and FAQs. The assistant reads the same file, so it stays in step with the site.

## Environment variables

| Name | Required | What it does |
| --- | --- | --- |
| `ANTHROPIC_API_KEY` | For the assistant | Anthropic API key. Without it the chat tells visitors to call instead. |
| `ANTHROPIC_MODEL` | No | Claude model for the assistant. Defaults to `claude-fable-5-2`. |
| `CRM_PASSWORD` | For the CRM | Owner password for `/crm`, at least 8 characters. Changing it signs everyone out. |
| `BLOB_READ_WRITE_TOKEN` | In production | Added by Vercel when a Blob store is connected. Leads are stored there as private JSON. |

Copy `.env.example` to `.env.local` for local work. Never commit real values.

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
