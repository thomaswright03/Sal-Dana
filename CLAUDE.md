@AGENTS.md

# Standing instruction from Thomas (2026-11-21): the backend doesn't have to work yet

This applies to every round of every stage and check the COO runs on this project (Legal, Excellence, Security,
fixes, re-grades, Approval work), and to anyone else grading or changing it.

The website's backend does not need to be functional yet. Don't fail, mark down or flag a check because a
backend feature isn't working end to end. That covers, for example:

- the AI booking assistant and the dashboard's "Ask AI" being off because no Anthropic API key is set;
- the site running in preview mode with sample data and sample reviews, hidden from search engines;
- bookings, leads, reviews and traffic in the `/crm` dashboard not being backed by real data or real customers;
- environment variables, keys or services that aren't set up yet.

Still grade and fix everything else as normal: the code that exists must be correct and safe (security holes,
leaked secrets, broken pages, accessibility, legal wording, and so on). Don't put "make the backend work" or
"add the API key" on Thomas's Needs you list for this project.

Thomas waived these Needs you items on 2026-11-21 because they are backend set-up. Treat them as not needed: don't
count them against any grade, don't block on them, and don't add them again in any form:

- getting an Anthropic API key for the assistant (ANTHROPIC_API_KEY in the COO environment or in Vercel);
- Alan's email address for lead alerts (LEAD_NOTIFY_EMAIL), a domain Sal Dana owns for Resend, and EMAIL_FROM.

# Business hours (Thomas, 2026-11-21)

Sal Dana's working hours are 9 AM to 5 PM. Use that everywhere the site states or uses hours: the hours shown on
the English and Spanish pages, what the booking assistant says, and the visit time slots in the booking form and
the dashboard (none may start before 9 AM). Thomas didn't change the days, so keep the days the site already uses.
These hours are confirmed, so the site doesn't need to call them "typical" or an assumption any more.
