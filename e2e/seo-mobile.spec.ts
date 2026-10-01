import { expect, test } from "@playwright/test";

test.use({ viewport: { width: 390, height: 844 } });

test.beforeAll(async ({ request }) => {
  const response = await request.post("/api/test/seed", { headers: { "x-e2e-seed-secret": "e2e-seed-secret" } });
  expect(response.ok()).toBeTruthy();
});

test("crawlable product HTML, canonical variant and real missing-page status", async ({ request, page, baseURL }) => {
  const product = await request.get("/products/e2e-dainty-ring?variant=E2E-RING-001-S8");
  expect(product.status()).toBe(200);
  const html = await product.text();
  expect(html).toContain("E2E Dainty Ring");
  expect(html).toContain('"@type":"ProductGroup"');
  expect(html).toContain('"sku":"E2E-RING-001-S8"');
  for (const path of ["/products/no-such-piece", "/shop?category=missing", "/shop?page=999", "/shop?page=-1", "/missing-route"]) {
    expect((await request.get(path)).status(), path).toBe(404);
  }
  await page.goto("/products/e2e-dainty-ring?variant=E2E-RING-001-S8");
  await expect(page.getByRole("radio", { name: "8 — Sold out", exact: true })).toBeChecked();
  await expect(page.getByRole("button", { name: "Sold out", exact: true })).toBeDisabled();
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", `${baseURL}/products/e2e-dainty-ring`);
});

test("mobile pages have one main landmark and no horizontal overflow", async ({ page }) => {
  for (const path of ["/", "/shop", "/shop?category=e2e-rings", "/products/e2e-dainty-ring", "/cart", "/checkout", "/login", "/about", "/contact", "/returns"]) {
    await page.goto(path);
    await expect(page.locator("h1")).toHaveCount(1);
    await expect(page.locator("main")).toHaveCount(1);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1), path).toBe(true);
  }
});

test("native bag dialog traps focus and closes on Escape", async ({ page }) => {
  await page.goto("/products/e2e-dainty-ring");
  await page.getByRole("button", { name: "Add to Cart", exact: true }).click();
  const dialog = page.getByRole("dialog", { name: "Shopping bag" });
  await expect(dialog).toBeVisible();
  expect(await dialog.evaluate((element) => element.matches(":modal"))).toBe(true);
  for (let i = 0; i < 15; i++) {
    await page.keyboard.press("Tab");
    expect(await dialog.evaluate((element) => document.activeElement === document.body || element.contains(document.activeElement))).toBe(true);
  }
  await page.keyboard.press("Escape");
  await expect(dialog).not.toBeVisible();
});
