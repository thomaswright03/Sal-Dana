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
