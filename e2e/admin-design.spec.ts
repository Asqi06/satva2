import { expect, test } from "@playwright/test";
import { encode } from "next-auth/jwt";

// The runner provisions this role only in its temporary Mongo database.
test.beforeEach(async ({ context }) => {
  const value = await encode({
    secret: "e2e-test-secret-not-for-production",
    salt: "authjs.session-token",
    token: {
      sub: "000000000000000000000001",
      email: "e2e-admin@example.com",
      name: "E2E Admin",
      role: "ADMIN",
    },
  });
  await context.addCookies([
    {
      name: "authjs.session-token",
      value,
      domain: "localhost",
      path: "/",
      httpOnly: true,
      sameSite: "Lax",
    },
  ]);
});

for (const width of [375, 768, 1440]) {
  test(`admin pages fit ${width}px without storefront chrome`, async ({
    page,
    request,
  }) => {
    test.setTimeout(180_000);
    await page.setViewportSize({ width, height: 900 });
    expect(
      (
        await request.post("/api/test/seed", {
          headers: { "x-e2e-seed-secret": "e2e-seed-secret" },
        })
      ).ok(),
    ).toBeTruthy();
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    for (const section of [
      "",
      "/products",
      "/products/new",
      "/categories",
      "/orders",
      "/reviews",
      "/coupons",
      "/banners",
      "/settings",
    ]) {
      await page.goto(`/admin${section}`);
      await expect(page.locator(".admin-app")).toBeVisible();
      await expect(page.getByRole("heading", { level: 1 })).toHaveCount(1);
      await expect(page.locator("footer")).toHaveCount(0);
      await expect(page.getByRole("navigation", { name: "Primary" })).toHaveCount(0);
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
      ).toBe(true);
      if (section === "")
        await page.screenshot({
          path: `.next/admin-dashboard-${width}.png`,
          fullPage: true,
          caret: "initial",
        });
      if (
        section === "/categories" ||
        section === "/products/new" ||
        section === "/settings"
      )
        await page.screenshot({
          path: `.next/admin-${section.split("/")[1]}-${width}.png`,
          fullPage: true,
          caret: "initial",
        });
    }
    await page.goto("/admin/products");
    await page
      .getByRole("link", { name: "E2E Dainty Ring", exact: true })
      .filter({ visible: true })
      .click();
    await expect(
      page.getByRole("heading", { name: "Edit product" }),
    ).toBeVisible({ timeout: 30_000 });
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    expect(errors).toEqual([]);
  });
}

test("mobile navigation works with keyboard and closes after selection", async ({
  page,
}) => {
  await page.setViewportSize({ width: 812, height: 375 });
  await page.goto("/admin");
  const summary = page.locator(".admin-app > div > details > summary");
  await summary.focus();
  await page.keyboard.press("Enter");
  const nav = page
    .getByRole("navigation", { name: "Admin navigation" })
    .filter({ visible: true });
  await nav.getByRole("link", { name: "Products", exact: true }).click();
  await expect(page).toHaveURL(/\/admin\/products$/);
  await expect(nav).not.toBeVisible();
  await summary.focus();
  await page.keyboard.press("Space");
  await expect(
    nav.getByRole("link", { name: "Products", exact: true }),
  ).toHaveAttribute("aria-current", "page");
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
});

test("category save prevents repeat submission, retains failed edits and focuses the editor", async ({
  page,
}) => {
  await page.setViewportSize({ width: 375, height: 900 });
  await page.goto("/admin/categories");
  await page.getByLabel("Name", { exact: true }).fill("E2E Admin Category");
  let release!: () => void;
  const pending = new Promise<void>((resolve) => {
    release = resolve;
  });
  await page.route("**/api/admin/categories", async (route) => {
    if (route.request().method() !== "POST") return route.continue();
    await pending;
    await route.fulfill({
      status: 500,
      json: { success: false, error: { message: "Temporary save failure" } },
    });
  });
  await page
    .getByRole("button", { name: "Create category", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "Saving…", exact: true }),
  ).toBeDisabled();
  await expect(page.getByLabel("Name", { exact: true })).toBeDisabled();
  release();
  await expect(page.getByRole("status")).toContainText(
    "Temporary save failure",
  );
  await expect(page.getByLabel("Name", { exact: true })).toHaveValue(
    "E2E Admin Category",
  );
  await page.unroute("**/api/admin/categories");
  await page
    .getByRole("button", { name: "Create category", exact: true })
    .click();
  await expect(page.getByRole("status")).toContainText("Category created.");
  const row = page
    .locator("li")
    .filter({ hasText: "E2E Admin Category" })
    .filter({ visible: true });
  await row.getByRole("button", { name: "Edit", exact: true }).click();
  await expect(page.getByLabel("Name", { exact: true })).toBeFocused();
  await expect(page.getByLabel("Name", { exact: true })).toHaveValue(
    "E2E Admin Category",
  );
  await page.getByRole("button", { name: "Cancel", exact: true }).click();
  await expect(page.getByLabel("Name", { exact: true })).toHaveValue("");
});

test("order details remain readable on mobile and retain unpaid order actions", async ({ page, request }) => {
  expect((await request.post("/api/test/seed", { headers: { "x-e2e-seed-secret": "e2e-seed-secret" } })).ok()).toBeTruthy();
  const catalogue = await (await page.request.get("/api/admin/products?q=E2E-RING-001")).json();
  const product = catalogue.data.products[0];
  expect((await request.post("/api/checkout/guest", { data: { items: [{ productId: product.id, variantSku: "E2E-RING-001-S6", qty: 1 }] } })).ok()).toBeTruthy();
  const placed = await request.post("/api/orders", { data: { email: "e2e-buyer@example.com", address: { fullName: "E2E Buyer", phone: "9876543210", addressLine1: "1 Temporary Street", city: "Vapi", state: "Gujarat", pincode: "396191" } } });
  expect(placed.status()).toBe(201);
  const order = (await placed.json()).data.order;
  await page.setViewportSize({ width: 375, height: 900 });
  await page.goto(`/admin/orders/${order.id}`);
  await expect(page.getByRole("heading", { name: /^Order / })).toBeVisible();
  await expect(page.getByRole("button", { name: "Cancel order", exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "Refund in full", exact: true })).toHaveCount(0);
  await expect(page.getByText("Delivery details", { exact: true })).toBeVisible();
  await expect(page.locator("address")).toContainText("Gujarat 396191");
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({ path: ".next/admin-order-mobile.png", fullPage: true, caret: "initial" });
});

test("settings groups remain editable and failed save preserves values", async ({
  page,
}) => {
  await page.goto("/admin/settings");
  await page.locator("summary").filter({ hasText: "Business & contact" }).click();
  await page
    .getByLabel("Customer support email", { exact: true })
    .fill("admin@example.com");
  await page.locator("summary").filter({ hasText: "Policies & about" }).click();
  await page
    .getByLabel("Return, exchange and refund policy", { exact: true })
    .fill("E2E policy draft");
  await page.locator("summary").filter({ hasText: "Search appearance" }).click();
  await page
    .getByLabel("Homepage title", { exact: true })
    .fill("E2E title draft");
  await page.route("**/api/admin/settings", async (route) => {
    expect(route.request().method()).toBe("PUT");
    const payload = route.request().postDataJSON();
    expect(payload.supportEmail).toBe("admin@example.com");
    expect(payload.returnPolicy).toBe("E2E policy draft");
    expect(payload.homeSeoTitle).toBe("E2E title draft");
    await route.fulfill({
      status: 500,
      json: { success: false, error: { message: "Save unavailable" } },
    });
  });
  await page
    .getByRole("button", { name: "Save settings", exact: true })
    .click();
  await expect(page.getByRole("status")).toContainText("Save unavailable");
  await expect(page.getByLabel("Homepage title", { exact: true })).toHaveValue(
    "E2E title draft",
  );
  await expect(
    page.getByRole("button", { name: "Save settings", exact: true }),
  ).toBeEnabled();
});

test("favicon files and manifest use the supplied SatvaStones assets", async ({
  page,
  request,
}) => {
  await page.goto("/admin");
  await expect(page.locator('link[rel="icon"][sizes="32x32"]')).toHaveAttribute(
    "href",
    "/favicon/favicon-32x32.png",
  );
  await expect(page.locator('link[rel="apple-touch-icon"]')).toHaveAttribute(
    "href",
    "/favicon/apple-touch-icon.png",
  );
  const manifest = await request.get("/favicon/site.webmanifest");
  expect(manifest.ok()).toBeTruthy();
  expect((await manifest.json()).name).toBe("SatvaStones");
  for (const asset of [
    "/favicon.ico",
    "/favicon/favicon-16x16.png",
    "/favicon/favicon-32x32.png",
    "/favicon/apple-touch-icon.png",
    "/favicon/android-chrome-192x192.png",
    "/favicon/android-chrome-512x512.png",
  ])
    expect((await request.get(asset)).ok()).toBeTruthy();
});
