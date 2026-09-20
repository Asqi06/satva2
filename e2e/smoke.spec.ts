import { expect, test } from "@playwright/test";

test("home renders the SatvaStones shell", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: /pretty things/i })).toBeVisible();
  await expect(page.getByRole("link", { name: /browse the collection/i })).toBeVisible();
});

test("health endpoint reports ok without secrets", async ({ request }) => {
  const response = await request.get("/api/health");
  expect(response.ok()).toBeTruthy();
  const body = await response.json();
  expect(body.success).toBe(true);
  expect(body.data.ok).toBe(true);
  expect(JSON.stringify(body)).not.toContain("s3cret");
});

test("security headers ship on pages", async ({ request }) => {
  const response = await request.get("/");
  const headers = response.headers();
  expect(headers["x-content-type-options"]).toBe("nosniff");
  expect(headers["x-frame-options"]).toBe("SAMEORIGIN");
  expect(headers["referrer-policy"]).toBe("strict-origin-when-cross-origin");
});
