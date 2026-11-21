// Forced-failure check against a deployed preview: submit a synthetic booking through the real form,
// screenshot what the visitor sees, and save /admin/status.json. Usage:
//   BASE=https://<preview> BYPASS=<vercel bypass secret> STATUS_TOKEN=<token> node scripts/forced-failure.mjs <label> <outdir>
import { chromium } from "@playwright/test";
import { mkdirSync, writeFileSync } from "node:fs";

const [label, outdir] = process.argv.slice(2);
const { BASE, BYPASS, STATUS_TOKEN } = process.env;
mkdirSync(outdir, { recursive: true });
const headers = { "x-vercel-protection-bypass": BYPASS };

const browser = await chromium.launch();
const ctx = await browser.newContext({ extraHTTPHeaders: headers, viewport: { width: 1280, height: 900 } });
const page = await ctx.newPage();
await page.goto(`${BASE}/#book`);
await page.locator('input[name="name"]').fill(`Forced-failure check ${label} (synthetic)`);
await page.locator('input[name="phone"]').fill("(480) 555-0100");
await page.locator('textarea[name="details"]').fill("Synthetic request for the forced-failure check. Please ignore.");
await page.getByRole("button", { name: /send|request|enviar|solicitar|submit/i }).first().click();
await page.waitForTimeout(6000);
await page.locator("#book").scrollIntoViewIfNeeded();
await page.screenshot({ path: `${outdir}/${label}-booking.png` });
const visible = (await page.locator("#book").innerText()).slice(0, 600);

const res = await ctx.request.get(`${BASE}/admin/status.json`, {
  headers: { ...headers, authorization: `Bearer ${STATUS_TOKEN}` },
});
const json = await res.json();
writeFileSync(`${outdir}/${label}-status.json`, JSON.stringify(json, null, 2));
// Render the status page's JSON as a screenshot for the record.
const shot = await ctx.newPage();
await shot.setContent(`<pre style="font:13px monospace;padding:16px">${JSON.stringify(json, null, 2).replace(/</g, "&lt;")}</pre>`);
await shot.screenshot({ path: `${outdir}/${label}-status.png`, fullPage: true });
console.log(JSON.stringify({ label, http: res.status(), overall: json.overall, visible }, null, 1));
await browser.close();
