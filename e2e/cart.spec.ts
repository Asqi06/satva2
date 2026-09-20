import { expect, request as baseRequest, test } from "@playwright/test";

/**
 * Guest shopping against seeded catalog (see /api/test/seed).
 * Authenticated cart/wishlist paths are covered in service tests;
 * live login remains a manual acceptance step.
 */
const SEED_HEADERS = { "x-e2e-seed-secret": "e2e-seed-secret" };

test.beforeAll(async ({ baseURL }) => {
  const ctx = await baseRequest.newContext({
    baseURL,
    extraHTTPHeaders: SEED_HEADERS,
  });
  const res = await ctx.post("/api/test/seed");
  expect(res.ok()).toBeTruthy();
  await ctx.dispose();
});

test("seed endpoint refuses callers without the secret", async ({ request }) => {
  const response = await request.post("/api/test/seed");
  expect(response.status()).toBe(404);
});

test("guest adds a seeded piece to the bag", async ({ page }) => {
  await page.goto("/products/e2e-dainty-ring");
  await expect(page.getByRole("heading", { name: /e2e dainty ring/i })).toBeVisible();
  await page.getByRole("button", { name: /add to bag/i }).click();
  await expect(page.getByRole("dialog", { name: /shopping bag/i })).toBeVisible();
  await expect(page.getByText("E2E Dainty Ring").first()).toBeVisible();
});

test("guest bag persists to the cart page with quantity controls", async ({ page }) => {
  await page.goto("/products/e2e-dainty-ring");
  await page.getByRole("button", { name: /add to bag/i }).click();
  await expect(page.getByRole("dialog", { name: /shopping bag/i })).toBeVisible();
  await page.getByRole("link", { name: /review bag/i }).click();
  await expect(page).toHaveURL(/\/cart/);
  await expect(page.getByRole("heading", { name: /1 piece/i })).toBeVisible();
  await page.getByRole("button", { name: /increase quantity/i }).click();
  await expect(page.getByRole("heading", { name: /2 pieces/i })).toBeVisible();
});

test("sold-out piece cannot be added", async ({ page }) => {
  await page.goto("/products/e2e-sold-out-band");
  await expect(page.getByRole("button", { name: /add to bag/i })).toBeDisabled();
});

test("bag drawer opens and closes from the keyboard", async ({ page }) => {
  await page.goto("/shop");
  const bagButton = page.getByRole("button", { name: /open shopping bag/i });
  await bagButton.focus();
  await page.keyboard.press("Enter");
  await expect(page.getByRole("dialog", { name: /shopping bag/i })).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog", { name: /shopping bag/i })).not.toBeVisible();
});

test("wishlist toggle sends guests to login", async ({ page }) => {
  await page.goto("/products/e2e-dainty-ring");
  await page.getByRole("button", { name: /wishlist/i }).click();
  await expect(page).toHaveURL(/\/login/);
});

test("product page shows the reviews section", async ({ page }) => {
  await page.goto("/products/e2e-dainty-ring");
  await expect(page.getByRole("heading", { name: /worn & loved/i })).toBeVisible();
  await expect(page.getByText(/no reviews yet/i)).toBeVisible();
});
