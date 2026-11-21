import { mkdirSync, readFileSync, writeFileSync, renameSync } from "node:fs";
import path from "node:path";
import { expect, test, type Page } from "@playwright/test";

/**
 * Collects review evidence against a local build with sample data: scroll videos of the home page,
 * screenshots of every CRM screen at 375 and 1440 px, and an axe scan. Run: `npm run evidence`.
 * Output goes to docs/evidence/<date>/.
 */
const OUT = path.join("docs", "evidence", process.env.EVIDENCE_DATE ?? new Date().toISOString().slice(0, 10));
mkdirSync(OUT, { recursive: true });
const axeSource = readFileSync(path.join("node_modules", "axe-core", "axe.min.js"), "utf8");

async function scrollThrough(page: Page) {
  const h = await page.evaluate(() => document.documentElement.scrollHeight);
  for (let y = 0; y < h; y += 500) {
    await page.evaluate((top) => window.scrollTo(0, top), y);
    await page.waitForTimeout(250);
  }
}

async function axe(page: Page, label: string, results: unknown[]) {
  await page.addScriptTag({ content: axeSource });
  const r = await page.evaluate(async () => {
    // @ts-expect-error injected by axe-core
    const res = await window.axe.run(document, { runOnly: ["wcag2a", "wcag2aa", "wcag21aa"] });
    return res.violations.map((v: { id: string; impact: string; help: string; nodes: { target: unknown[] }[] }) => ({
      id: v.id,
      impact: v.impact,
      help: v.help,
      nodes: v.nodes.slice(0, 5).map((n) => n.target),
    }));
  });
  results.push({ page: label, violations: r });
}

for (const [name, width, height] of [["390", 390, 844], ["1440", 1440, 900]] as const) {
  for (const reduced of [false, true]) {
    test(`home page scroll video ${name}px ${reduced ? "reduced-motion" : "full-motion"}`, async ({ browser }) => {
      const context = await browser.newContext({
        viewport: { width, height },
        reducedMotion: reduced ? "reduce" : "no-preference",
        recordVideo: { dir: path.join(OUT, "tmp"), size: { width: Math.min(width, 800), height: Math.round((Math.min(width, 800) * height) / width) } },
      });
      const page = await context.newPage();
      await page.goto("/");
      await scrollThrough(page);
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
      expect(overflow, "no horizontal scroll").toBeLessThanOrEqual(0);
      const video = page.video();
      await context.close();
      renameSync((await video!.path()) as string, path.join(OUT, `home-${name}-${reduced ? "reduced" : "motion"}.webm`));
    });
  }
}

test("CRM screens at 375 and 1440, plus axe scans", async ({ browser }) => {
  const results: unknown[] = [];
  for (const width of [375, 1440]) {
    const context = await browser.newContext({ viewport: { width, height: width === 375 ? 800 : 900 } });
    const page = await context.newPage();
    await page.goto("/crm/login");
    await page.locator('input[type="password"]').fill("e2e-owner-password");
    await page.getByRole("button", { name: "Sign in" }).click();
    await page.waitForURL("**/crm");
    // Fill the dashboard with sample leads, reviews and traffic.
    await page.request.post("/api/crm/demo", { data: { action: "load" } }).catch(() => null);
    for (const [slug, route] of [["overview", "/crm"], ["leads", "/crm/leads"], ["schedule", "/crm/schedule"], ["reviews", "/crm/reviews"], ["traffic", "/crm/traffic"], ["ask", "/crm/ask"], ["settings", "/crm/settings"]] as const) {
      await page.goto(route);
      await page.waitForLoadState("networkidle");
      await page.waitForTimeout(600);
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
      expect(overflow, `${slug} @${width}: no horizontal scroll`).toBeLessThanOrEqual(0);
      await page.screenshot({ path: path.join(OUT, `crm-${slug}-${width}.png`), fullPage: false });
      if (slug === "leads" && width === 1440) await axe(page, "/crm/leads", results);
      if (slug === "leads") {
        const row = page.locator("tbody tr, [data-lead-row]").first();
        if (await row.count()) {
          await row.click().catch(() => null);
          await page.waitForTimeout(500);
          await page.screenshot({ path: path.join(OUT, `crm-lead-drawer-${width}.png`) });
        }
      }
    }
    await context.close();
  }
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  for (const route of ["/", "/es"]) {
    await page.goto(route);
    await scrollThrough(page);
    await axe(page, route, results);
  }
  await page.goto("/admin/login");
  await page.locator('input[type="password"]').fill("e2e-admin-password-123");
  await page.getByRole("button", { name: "Sign in" }).click();
  await page.waitForURL("**/admin");
  await axe(page, "/admin", results);
  await ctx.close();
  writeFileSync(path.join(OUT, "axe.json"), JSON.stringify(results, null, 2));
  const serious = (results as { violations: { impact: string }[] }[]).flatMap((r) => r.violations).filter((v) => v.impact === "serious" || v.impact === "critical");
  expect(serious, "serious or critical axe violations").toEqual([]);
});
