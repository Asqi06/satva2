import { expect, test } from "@playwright/test";

test("shop renders catalogue shell", async ({ page }) => {
  await page.goto("/shop");
  await expect(page.getByRole("heading", { name: /all jewellery/i })).toBeVisible();
  await expect(page.getByLabel("Filter and sort products")).toBeVisible();
});

test("unknown product slug shows the not-found page", async ({ page }) => {
  await page.goto("/products/no-such-piece");
  await expect(page.getByRole("heading", { name: /page not found/i })).toBeVisible();
});

test("public product API returns an envelope", async ({ request }) => {
  const response = await request.get("/api/products?limit=5");
  expect(response.ok()).toBeTruthy();
  const body = await response.json();
  expect(body.success).toBe(true);
  // cart.spec.ts may seed this shared DB — assert shape, not emptiness.
  expect(Array.isArray(body.data.products)).toBe(true);
  expect(typeof body.data.pagination.total).toBe("number");
});

test("public categories API returns an envelope", async ({ request }) => {
  const response = await request.get("/api/categories");
  expect(response.ok()).toBeTruthy();
  const body = await response.json();
  expect(body.success).toBe(true);
  expect(Array.isArray(body.data.categories)).toBe(true);
});

test("admin product API rejects anonymous callers", async ({ request }) => {
  const response = await request.get("/api/admin/products");
  expect(response.status()).toBe(401);
  const body = await response.json();
  expect(body.success).toBe(false);
});

test("admin category API rejects anonymous writes", async ({ request }) => {
  const response = await request.post("/api/admin/categories", {
    data: { name: "Sneaky" },
  });
  expect(response.status()).toBe(401);
});
