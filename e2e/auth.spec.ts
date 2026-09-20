import { expect, test } from "@playwright/test";

/**
 * Auth guard coverage (no live Google OAuth in CI — the OAuth round-trip
 * itself is a documented manual acceptance step for Phase 1).
 * Dev server runs with dummy env (see playwright.config.ts webServer.env):
 * JWT verification works, sessions are simply absent.
 */

test("login page offers Google sign-in", async ({ page }) => {
  await page.goto("/login");
  await expect(
    page.getByRole("button", { name: /continue with google/i }),
  ).toBeVisible();
});

test("account requires login", async ({ page }) => {
  await page.goto("/account");
  await expect(page).toHaveURL(/\/login/);
});

test("admin requires login", async ({ page }) => {
  await page.goto("/admin");
  await expect(page).toHaveURL(/\/login/);
});

test("account API returns 401 without a session", async ({ request }) => {
  const response = await request.get("/api/account/me");
  expect(response.status()).toBe(401);
  const body = await response.json();
  expect(body).toEqual({
    success: false,
    error: { code: "UNAUTHORIZED", message: "Login required" },
  });
});
