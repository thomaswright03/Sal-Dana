import { expect, test } from "@playwright/test";

test("a booking request shows up in the owner's CRM", async ({ page }) => {
  const name = `E2E Customer ${Date.now()}`;

  await page.goto("/#book");
  await page.locator('input[name="name"]').fill(name);
  await page.locator('input[name="phone"]').fill("(480) 555-0123");
  await page.locator('textarea[name="details"]').fill("Patch a hole in the garage drywall");
  await page.getByRole("button", { name: /send|request|enviar|solicitar|submit/i }).first().click();
  await expect(page.getByText(/received|got it|booked|recibimos|solicitud/i).first()).toBeVisible({ timeout: 15_000 });

  await page.goto("/crm/login");
  await page.locator('input[type="password"]').fill("e2e-owner-password");
  await page.getByRole("button", { name: "Sign in" }).click();
  await page.waitForURL("**/crm");
  await page.goto("/crm/leads");
  await expect(page.getByText(name).first()).toBeVisible({ timeout: 15_000 });
});

test("the admin status page needs its own login and reports status", async ({ page, request }) => {
  expect((await request.get("/admin/status.json")).status()).toBe(401);
  const ok = await request.get("/admin/status.json", { headers: { Authorization: "Bearer e2e-status-token-123456" } });
  expect(ok.status()).toBe(200);
  expect(["ok", "warning", "down", "unknown"]).toContain(((await ok.json()) as { overall: string }).overall);

  await page.goto("/admin");
  await page.waitForURL("**/admin/login");
  await page.locator('input[type="password"]').fill("e2e-admin-password-123");
  await page.getByRole("button", { name: "Sign in" }).click();
  await page.waitForURL("**/admin");
  await expect(page.getByTestId("overall")).toBeVisible();
  await expect(page.getByText("Booking form saves a lead")).toBeVisible();
});

test("unknown pages show the branded 404 with call and text", async ({ page }) => {
  const res = await page.goto("/nope");
  expect(res?.status()).toBe(404);
  await expect(page.getByRole("link", { name: /^Call/ }).first()).toBeVisible();
});
