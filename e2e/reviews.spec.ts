import { expect, test } from "@playwright/test";

test("review writes require login", async ({ request }) => {
  const response = await request.post("/api/products/e2e-dainty-ring/reviews", {
    data: { rating: 5 },
  });
  expect(response.status()).toBe(401);
});

test("admin coupon and review APIs require admin", async ({ request }) => {
  expect((await request.get("/api/admin/coupons")).status()).toBe(401);
  expect((await request.get("/api/admin/reviews")).status()).toBe(401);
  expect(
    (await request.post("/api/admin/coupons", { data: { code: "X", type: "FIXED", value: 1 } })).status(),
  ).toBe(401);
});
