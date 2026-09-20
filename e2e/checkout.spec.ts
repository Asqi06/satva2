import crypto from "node:crypto";
import { expect, test } from "@playwright/test";

/**
 * Checkout guards + webhook signature gate. Money movement itself needs
 * live Razorpay keys (manual acceptance in test mode, per Phase 4 gate).
 */

test("checkout shows a login prompt to guests", async ({ page }) => {
  await page.goto("/checkout");
  // Generous timeout: cold dev-server compile under parallel workers.
  await expect(page.getByRole("heading", { name: /one step first/i })).toBeVisible({ timeout: 15000 });
  await expect(page.getByRole("link", { name: /continue with google/i })).toBeVisible();
});

test("checkout APIs require login", async ({ request }) => {
  for (const [method, url] of [
    ["GET", "/api/addresses"],
    ["POST", "/api/orders"],
    ["POST", "/api/coupons/validate"],
    ["POST", "/api/payments/create"],
  ] as const) {
    const response =
      method === "GET" ? await request.get(url) : await request.post(url, { data: {} });
    expect(response.status(), url).toBe(401);
  }
});

test("webhook rejects bad signatures", async ({ request }) => {
  const raw = JSON.stringify({ id: "evt_x", event: "payment.captured", payload: {} });
  const bad = await request.post("/api/webhooks/razorpay", {
    data: raw,
    headers: { "content-type": "application/json", "x-razorpay-signature": "nope" },
  });
  expect(bad.status()).toBe(400);
});

test("cron sweep requires its bearer secret", async ({ request }) => {
  const response = await request.get("/api/cron/release-reservations");
  expect(response.status()).toBe(401);
});

test("webhook acks signed events for unknown orders", async ({ request }) => {
  const raw = JSON.stringify({
    id: "evt_unknown",
    event: "payment.captured",
    payload: { payment: { entity: { id: "pay_unknown", order_id: "order_unknown" } } },
  });
  const sig = crypto.createHmac("sha256", "e2e-webhook-secret").update(raw).digest("hex");
  const response = await request.post("/api/webhooks/razorpay", {
    data: raw,
    headers: { "content-type": "application/json", "x-razorpay-signature": sig },
  });
  expect(response.ok()).toBeTruthy();
  const body = await response.json();
  expect(body).toEqual({ success: true, data: { ack: true, settled: false } });
});
