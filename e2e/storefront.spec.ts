import { expect, test } from "@playwright/test";

test.use({ viewport: { width: 390, height: 844 } });
test.beforeAll(async ({ request }) => {
  expect((await request.post("/api/test/seed", { headers: { "x-e2e-seed-secret": "e2e-seed-secret" } })).ok()).toBeTruthy();
});

test("mobile search is visible, keyboard accessible and finds partial names and SKUs", async ({ page }) => {
  await page.goto("/shop");
  await page.getByRole("button", { name: "Search jewellery", exact: true }).click();
  const dialog = page.getByRole("dialog", { name: "Search jewellery" });
  await expect(dialog).toBeVisible();
  await dialog.getByRole("searchbox").fill("daint");
  await expect(dialog.getByRole("link", { name: /E2E Dainty Ring/ })).toBeVisible();
  await dialog.getByRole("searchbox").press("ArrowDown");
  expect(await dialog.evaluate(el => el.contains(document.activeElement))).toBe(true);
  await page.keyboard.press("Escape");
  await expect(dialog).not.toBeVisible();
  await expect(page.getByRole("button", { name: "Search jewellery", exact: true })).toBeFocused();
  expect((await (await page.request.get("/api/search?q=E2E-RING-001-S6")).json()).data.products[0].slug).toBe("e2e-dainty-ring");
});

test("mobile filters remain in the URL when opening a product and returning", async ({ page }) => {
  await page.goto("/shop");
  await page.getByRole("button", { name: /^Filters/ }).click();
  const dialog = page.getByRole("dialog", { name: "Filters", exact: true });
  await dialog.getByLabel("Minimum price").fill("400");
  await dialog.getByRole("button", { name: "Apply price" }).click();
  await expect(page).toHaveURL(/minPrice=400/);
  await dialog.getByRole("button", { name: "View products" }).click();
  await page.getByRole("link", { name: "E2E Dainty Ring", exact: true }).last().click();
  await expect(page).toHaveURL(/\/products\/e2e-dainty-ring/);
  await expect(page.getByRole("heading", { name: "E2E Dainty Ring", exact: true })).toBeVisible();
  await page.goBack();
  await expect(page.getByRole("button", { name: "Remove Minimum price filter" })).toBeVisible();
  await page.getByRole("button", { name: "Remove Minimum price filter" }).click();
  await expect(page).not.toHaveURL(/minPrice/);
});

test("gallery zoom and mobile sticky purchase preserve the chosen option", async ({ page }) => {
  await page.goto("/products/e2e-dainty-ring");
  await page.getByRole("button", { name: "View larger product photo" }).click();
  const photo = page.getByRole("dialog", { name: "Larger product photo" });
  await expect(photo).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(photo).not.toBeVisible();
  await page.getByRole("heading", { name: "Customer reviews", exact: true }).scrollIntoViewIfNeeded();
  const sticky = page.getByRole("button", { name: "Add to Cart", exact: true }).last();
  await expect(sticky).toBeVisible();
  await sticky.click();
  await expect(page.getByRole("dialog", { name: "Shopping bag" }).getByText("6", { exact: true })).toBeVisible();
});

test("guest checkout creates one server-priced order, preserves retry and blocks another browser", async ({ page, browser }) => {
  await page.goto("/products/e2e-dainty-ring");
  await page.getByRole("button", { name: "Add to Cart", exact: true }).first().click();
  await page.getByRole("dialog", { name: "Shopping bag" }).getByRole("link", { name: "Checkout", exact: true }).click();
  await expect(page.getByText("Checkout as a guest.", { exact: false })).toBeVisible();
  await page.getByLabel("Email address", { exact: true }).fill("guest@example.com");
  await page.getByLabel("Full name", { exact: true }).fill("Guest Buyer");
  await page.getByLabel("Mobile number", { exact: true }).fill("9876543210");
  await page.getByLabel("Street address", { exact: true }).fill("10 Test Street");
  await page.getByLabel("City", { exact: true }).fill("Vapi");
  await page.getByLabel("State", { exact: true }).fill("Gujarat");
  await page.getByLabel("PIN code", { exact: true }).fill("396191");
  await page.getByRole("button", { name: "Continue to Payment" }).click();
  await expect(page.getByRole("heading", { name: "Review & pay" })).toBeVisible();
  const cookies = await page.context().cookies();
  expect(cookies.find(cookie => cookie.name === "satva-guest-checkout")).toMatchObject({ httpOnly: true, sameSite: "Lax" });
  expect((await page.request.get("/api/addresses")).status()).toBe(401);
  // The gateway is simulated; no network request is made to Razorpay.
  await page.evaluate(() => {
    window.Razorpay = class {
      constructor(private options: { modal?: { ondismiss: () => void } }) {}
      open() { this.options.modal?.ondismiss(); }
      close() {}
    } as unknown as typeof window.Razorpay;
  });
  let attempts = 0;
  await page.route("**/api/payments/create", async route => { attempts++; await route.fulfill({ json: { success: true, data: { keyId: "test", razorpayOrderId: "gateway-simulated", amount: 49900, currency: "INR" } } }); });
  await page.getByRole("button", { name: /^Pay ₹499/ }).click();
  await expect(page.getByText(/Payment window closed/)).toBeVisible();
  const saved = await page.evaluate(() => sessionStorage.getItem("satva:pending-order"));
  expect(saved).toMatch(/^[a-f0-9]{24}$/);
  const own = await page.request.get(`/api/orders/${saved}`);
  const order = (await own.json()).data.order;
  expect(order).toMatchObject({ isGuest: true, customerEmail: "guest@example.com", total: 499 });
  expect(order.items[0]).toMatchObject({ variantSku: "E2E-RING-001-S6", variantLabel: "6", qty: 1, unitPrice: 499 });
  await page.getByRole("button", { name: /^Retry payment/ }).click();
  await expect.poll(() => attempts).toBe(2);
  expect(await page.evaluate(() => sessionStorage.getItem("satva:pending-order"))).toBe(saved);
  await page.reload();
  await expect(page.getByRole("button", { name: /^Retry payment/ })).toBeVisible();
  const foreign = await browser.newContext();
  await foreign.request.post("http://localhost:3100/api/checkout/guest", { data: { items: [] } });
  expect((await foreign.request.get(`http://localhost:3100/api/orders/${saved}`)).status()).toBe(404);
  expect((await foreign.request.post("http://localhost:3100/api/payments/create", { data: { orderId: saved } })).status()).toBe(404);
  await foreign.close();
  await page.goto(`/orders/${saved}`);
  await expect(page.getByRole("heading", { name: `Order ${order.id.slice(-8).toUpperCase()}` })).toBeVisible();
  await page.evaluate(() => sessionStorage.removeItem("satva:pending-order"));
  await page.getByRole("link", { name: "Continue payment", exact: true }).click();
  await expect(page.getByRole("button", { name: /^Retry payment/ })).toBeVisible();
  expect(await page.evaluate(() => sessionStorage.getItem("satva:pending-order"))).toBe(saved);
  await page.request.post(`/api/orders/${saved}/cancel`, { data: {} });
});
