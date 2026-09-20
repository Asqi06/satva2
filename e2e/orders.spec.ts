import { expect, test } from "@playwright/test";

test("account orders require login", async ({ page }) => {
  await page.goto("/account/orders");
  await expect(page).toHaveURL(/\/login/);
});

test("orders APIs require login", async ({ request }) => {
  const list = await request.get("/api/orders");
  expect(list.status()).toBe(401);
  const adminList = await request.get("/api/admin/orders");
  expect(adminList.status()).toBe(401);
});

test("admin order page requires login", async ({ page }) => {
  await page.goto("/admin/orders");
  await expect(page).toHaveURL(/\/login/);
});
