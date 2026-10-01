import { expect, test } from "@playwright/test";

test.beforeAll(async ({ request }) => {
  const response = await request.post("/api/test/seed", { headers: { "x-e2e-seed-secret": "e2e-seed-secret" } });
  expect(response.ok()).toBeTruthy();
});

test("verified online business identity and buying guide are present in server HTML", async ({ request }) => {
  const home = await request.get("/");
  const html = await home.text();
  expect(html).toContain('"@type":"OnlineStore"');
  expect(html).toContain('"addressLocality":"Vapi"');
  expect(html).toContain("https://www.instagram.com/satvastonesjewelry/");
  expect(html).not.toContain('"@type":"JewelryStore"');
  const guide = await request.get("/guides/jewellery-buying-guide");
  expect(guide.status()).toBe(200);
  expect(await guide.text()).toContain('"@type":"Article"');
  expect(await (await request.get("/sitemap.xml")).text()).toContain("/guides/jewellery-buying-guide");
});

test("merchant feed selects real fixture variants with their price and availability", async ({ request }) => {
  const response = await request.get("/product-feed.xml");
  expect(response.status()).toBe(200);
  expect(response.headers()["content-type"]).toContain("application/xml");
  const feed = await response.text();
  expect(feed).toContain("variant=E2E-RING-001-S8");
  expect(feed).toContain("<g:availability>out_of_stock</g:availability>");
  expect(feed).not.toContain("variant=undefined");
  expect(feed).not.toContain("<g:gtin>");
});

test("mobile header controls retain 44px touch targets and the guide fits the viewport", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/guides/jewellery-buying-guide");
  await expect(page.locator("h1")).toHaveCount(1);
  await expect(page.locator("main")).toHaveCount(1);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1)).toBe(true);
  for (const label of ["Open menu", "Search jewellery"]) {
    const size = await page.getByRole("button", { name: label, exact: true }).boundingBox();
    expect(size?.height).toBeGreaterThanOrEqual(44);
    expect(size?.width).toBeGreaterThanOrEqual(44);
  }
  await page.goto("/contact");
  await expect(page.getByText("We do not have a shop for customer visits.", { exact: false })).toBeVisible();
});
