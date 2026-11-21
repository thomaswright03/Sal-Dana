import { mkdirSync, renameSync } from "node:fs";
import path from "node:path";
import { expect, test, type Page } from "@playwright/test";

/** Video walkthroughs of the owner's flows on the current build. Output: docs/evidence/<date>/flow-*.webm. */
const OUT = path.join("docs", "evidence", process.env.EVIDENCE_DATE ?? new Date().toISOString().slice(0, 10));
mkdirSync(OUT, { recursive: true });

function nextWeekday(offset: number): string {
  const d = new Date();
  d.setDate(d.getDate() + 3 + offset);
  while (d.getDay() === 0) d.setDate(d.getDate() + 1);
  return d.toISOString().slice(0, 10);
}

async function recorded(browser: import("@playwright/test").Browser, name: string, run: (page: Page) => Promise<void>) {
  const context = await browser.newContext({
    viewport: { width: 1280, height: 800 },
    recordVideo: { dir: path.join(OUT, "tmp"), size: { width: 1280, height: 800 } },
  });
  const page = await context.newPage();
  try {
    await run(page);
  } finally {
    const video = page.video();
    await context.close();
    renameSync((await video!.path()) as string, path.join(OUT, `flow-${name}.webm`));
  }
}

async function signIn(page: Page) {
  await page.goto("/crm/login");
  await page.locator('input[type="password"]').fill("e2e-owner-password");
  await page.getByRole("button", { name: "Sign in" }).click();
  await page.waitForURL("**/crm");
}

const pause = (page: Page) => page.waitForTimeout(900);

test("lead: add, edit, delete", async ({ browser }) => {
  await recorded(browser, "lead-add-edit-delete", async (page) => {
    await signIn(page);
    await page.goto("/crm/leads");
    await page.getByRole("button", { name: "New lead" }).click();
    const drawer = page.getByRole("dialog");
    await drawer.getByLabel("Customer").or(drawer.getByLabel("Name")).first().fill("Walkthrough Customer");
    await drawer.getByLabel("Phone").fill("(480) 555-0142");
    await drawer.getByLabel("Job").fill("Door hanging");
    await pause(page);
    await drawer.getByRole("button", { name: "Create lead" }).click();
    await expect(page.getByText("Walkthrough Customer").first()).toBeVisible();
    await pause(page);
    await drawer.getByLabel("Job").fill("Door hanging and trim");
    await drawer.getByLabel("Stage").selectOption({ index: 1 });
    await pause(page);
    await drawer.getByRole("button", { name: "Save changes" }).click();
    await pause(page);
    await drawer.getByRole("button", { name: "Delete lead" }).click();
    await pause(page);
    await drawer.getByRole("button", { name: "Delete", exact: true }).click();
    await expect(page.getByText("Walkthrough Customer")).toHaveCount(0);
    await pause(page);
  });
});

test("visit: confirm, slot conflict, book it anyway", async ({ browser }) => {
  const day = nextWeekday(1);
  await recorded(browser, "visit-confirm-conflict", async (page) => {
    await signIn(page);
    const stamp = Date.now() % 100000;
    const [a, b] = [`Visit Customer A${stamp}`, `Visit Customer B${stamp}`];
    for (const name of [a, b]) {
      await page.request.post("/api/crm/leads", { data: { name, phone: "(480) 555-0150", service: "Painting" } });
    }
    await page.goto("/crm/leads");
    const setVisit = async (name: string) => {
      await page.getByText(name).first().click();
      const drawer = page.getByRole("dialog");
      await drawer.locator('input[type="date"]').fill(day);
      await drawer.locator("fieldset select").first().selectOption({ index: 0 });
      await pause(page);
      await drawer.getByRole("button", { name: "Save changes" }).click();
    };
    await setVisit(a);
    await pause(page);
    await page.getByRole("button", { name: "Close" }).first().click();
    await setVisit(b);
    const alert = page.locator('[role="alert"]:not(#__next-route-announcer__)');
    await expect(alert).toContainText(/booked|taken|already/i);
    await pause(page);
    await alert.getByRole("button", { name: "Book it anyway" }).click();
    await pause(page);
    await page.goto("/crm/schedule");
    await page.waitForLoadState("networkidle");
    const confirm = page.getByRole("button", { name: "Confirm", exact: true }).first();
    if (await confirm.count()) await confirm.click();
    await pause(page);
    await pause(page);
  });
});

test("review: add and publish", async ({ browser }) => {
  await recorded(browser, "review-add-publish", async (page) => {
    await signIn(page);
    await page.goto("/crm/reviews");
    await page.getByRole("button", { name: "Add a review" }).first().click();
    const drawer = page.getByRole("dialog");
    await drawer.getByPlaceholder("First name and last initial").fill("Walkthrough W.");
    await drawer.getByRole("button", { name: "5 stars" }).click();
    await drawer.getByPlaceholder("Copy the review exactly as the customer wrote it").fill("Walkthrough review text, added for the evidence video.");
    await drawer.getByPlaceholder(/Who agreed/).fill("Test: agreed in the walkthrough");
    await drawer.getByPlaceholder(/Family, staff/).fill("None");
    await pause(page);
    await drawer.getByLabel("Show this review on the website").check();
    await drawer.getByRole("button", { name: "Add review" }).click();
    await expect(page.getByText("Walkthrough W.").first()).toBeVisible();
    await pause(page);
    await pause(page);
  });
});

test("settings: assistant kill switch", async ({ browser }) => {
  await recorded(browser, "assistant-kill-switch", async (page) => {
    await signIn(page);
    await page.goto("/crm/settings");
    await page.getByRole("button", { name: "Turn off" }).click();
    await expect(page.getByRole("button", { name: "Turn on" })).toBeVisible();
    await pause(page);
    await pause(page);
    await page.getByRole("button", { name: "Turn on" }).click();
    await expect(page.getByRole("button", { name: "Turn off" })).toBeVisible();
    await pause(page);
  });
});

test("admin: sign in and view the status page", async ({ browser }) => {
  await recorded(browser, "admin-status", async (page) => {
    await page.goto("/admin/login");
    await page.locator('input[type="password"]').fill("e2e-admin-password-123");
    await page.getByRole("button", { name: "Sign in" }).click();
    await page.waitForURL("**/admin");
    await pause(page);
    await page.evaluate(() => window.scrollTo(0, 600));
    await pause(page);
    await pause(page);
  });
});
