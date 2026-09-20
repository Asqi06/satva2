import { expect, test } from "@playwright/test";

test("newsletter signup succeeds from the homepage", async ({ page }) => {
  await page.goto("/");
  await page.getByLabel("Email address").fill("reader@example.in");
  await page.getByRole("button", { name: /^join$/i }).click();
  await expect(page.getByText(/on the list/i)).toBeVisible();
});

test("newsletter rejects bad emails", async ({ request }) => {
  const response = await request.post("/api/newsletter", { data: { email: "nope" } });
  expect(response.status()).toBe(400);
});

test("newsletter rate-limits bursts", async ({ request }) => {
  const statuses: number[] = [];
  for (let i = 0; i < 6; i++) {
    const res = await request.post("/api/newsletter", { data: { email: `burst${i}@example.in` } });
    statuses.push(res.status());
  }
  expect(statuses).toContain(429);
});

test("contact page submits a message", async ({ page }) => {
  await page.goto("/contact");
  await page.getByLabel("Name", { exact: true }).fill("Test Human");
  await page.getByLabel("Email", { exact: true }).fill("human@example.in");
  await page.getByLabel("Message", { exact: true }).fill("Where is my order, please?");
  await page.getByRole("button", { name: /send message/i }).click();
  await expect(page.getByText(/message received/i)).toBeVisible();
});

test("banner admin API requires admin", async ({ request }) => {
  expect((await request.get("/api/admin/banners")).status()).toBe(401);
});

test("policy pages render with metadata", async ({ page }) => {
  for (const [path, heading] of [
    ["/about", /jewellery for the other days/i],
    ["/faq", /good questions/i],
    ["/shipping", /shipping & packaging/i],
    ["/returns", /returns & exchanges/i],
    ["/privacy", /privacy policy/i],
    ["/terms", /terms of service/i],
  ] as const) {
    await page.goto(path);
    await expect(page.getByRole("heading", { name: heading }).first()).toBeVisible();
  }
});
