import { expect, test } from "@playwright/test";

for (const reducedMotion of ["reduce", "no-preference"] as const) {
  test(`home page hydrates without errors (motion: ${reducedMotion})`, async ({ browser }) => {
    const page = await browser.newPage({ reducedMotion, baseURL: "http://localhost:3100" });
    const errors: string[] = [];
    page.on("pageerror", (e) => errors.push(e.message));
    page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
    await page.goto("/");
    await expect(page.locator("#book")).toBeAttached();
    await page.waitForTimeout(2500);
    expect(errors).toEqual([]);
    await page.close();
  });
}

test("Spanish pages are served with lang=es from the server", async ({ request }) => {
  for (const path of ["/es", "/es/privacy", "/es/terms"]) {
    expect(await (await request.get(path)).text()).toContain('<html lang="es"');
  }
  expect(await (await request.get("/")).text()).toContain('<html lang="en"');
});
